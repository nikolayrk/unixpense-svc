import { gmail_v1, google } from 'googleapis';
import { injectable } from 'inversify';
import GmailMessageData from '../strategies/gmail/models/gmailMessageData';
import GoogleOAuth2ClientProvider from '../providers/googleOAuth2ClientProvider';
import { injectables } from '../../shared/types/injectables';
import GoogleOAuth2Identifiers from '../../shared/models/googleOAuth2Identifiers';
import { DependencyInjector } from '../../dependencyInjector';
import IUsesGoogleOAuth2 from '../contracts/IUsesGoogleOAuth2';

@injectable()
export default class GmailApiClient implements IUsesGoogleOAuth2 {
    public credentials: GoogleOAuth2Identifiers;

    private googleOAuth2ClientProvider: GoogleOAuth2ClientProvider;
    private gmail: gmail_v1.Gmail;
    private exponentialBackoffDepth = 0;

    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';
    private readonly maxExponentialBackoffDepth: number = 7;

    public constructor() {
        this.credentials = null!;
        this.googleOAuth2ClientProvider = null!;
        this.gmail = null!;
    }

    public async useAsync(credentials: GoogleOAuth2Identifiers) {
        this.googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateServiceAsync(injectables.GoogleOAuth2ClientProviderGenerator, credentials);
        this.gmail = google.gmail({version: 'v1', auth: this.googleOAuth2ClientProvider.client});
    }

    public async * generateMessageIdsAsync(pageToken?: string): AsyncGenerator<string, [], undefined> {
        const { messages, nextPageToken } = await this.fetchMessagesAsync(pageToken);

        for (const messageItem of messages) {
            if (messageItem.id === null || messageItem.id === undefined) {
                this.googleOAuth2ClientProvider.logWarning('Empty message id. Skipping...', { messageItem: JSON.stringify(messageItem) });

                continue;
            }
            
            yield messageItem.id;
        }

        if (nextPageToken !== null && nextPageToken !== undefined) {
            yield * this.generateMessageIdsAsync(nextPageToken);
        }

        return [];
    }
    
    public async fetchMessageDataAsync(messageId: string) {
        const messageResponse = await this.makeApiCallAsync(async () =>
            this.gmail.users.messages.get({
                userId: 'me',
                id: messageId
            }));
    
        const message = messageResponse.data;

        const messageData = this.constructMessageData(message);
    
        return messageData;
    }
    
    public async fetchAttachmentDataBase64Async(messageData: GmailMessageData) {
        const response = await this.makeApiCallAsync(async () => 
            this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageData.messageId,
                id: messageData.attachmentId
            }));

        const messagePartBody = response.data;
        const attachmentDataBase64 = String(messagePartBody.data);
    
        return attachmentDataBase64;
    }
    
    private async fetchMessagesAsync(pageToken?: string | undefined) {
        this.googleOAuth2ClientProvider.logEvent(`Requesting messages...`);

        const response = await this.makeApiCallAsync(async () =>
            this.gmail.users.messages.list({
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            }));

        const messageList = response.data;
        const messages = messageList.messages;
        const nextPageToken = messageList.nextPageToken;
    
        if (messages === undefined) {
            this.googleOAuth2ClientProvider.logWarning(`Failed to get messages`);

            return { messages: [], nextPageToken: null };
        }
    
        this.googleOAuth2ClientProvider.logEvent(`Received ${messages.length} messages`);
    
        return { messages, nextPageToken };
    }

    private constructMessageData(message: gmail_v1.Schema$Message) {
        return {
            messageId: String(message.id),
            attachmentId: String(message
                .payload
               ?.parts
               ?.[1]
               ?.body
               ?.attachmentId)
        } as GmailMessageData
    }

    private async makeApiCallAsync<T>(apiCall: () => T): Promise<T> {
        let result;

        try {
            result = await apiCall();
        } catch(ex) {
            this.googleOAuth2ClientProvider.logWarning(`Gmail API call failed (${(ex as Error).message ?? ex}). Reattempting after ${this.exponentialBackoffDepth ** 2}s...`);
            
            result = await this.tryExponentialBackoffAsync(ex, () => this.makeApiCallAsync(apiCall));
        }

        return result;
    }

    private async tryExponentialBackoffAsync<T>(ex: unknown, operation: () => T): Promise<T> {
        if (this.exponentialBackoffDepth > this.maxExponentialBackoffDepth) {
            this.exponentialBackoffDepth = 0;

            throw ex;
        }
        
        await new Promise(res => setTimeout(res, 2 ** this.exponentialBackoffDepth++ * 1000));

        const result = await operation();

        this.exponentialBackoffDepth = 0;

        return result;
    }
}