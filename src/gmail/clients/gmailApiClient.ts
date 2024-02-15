import { gmail_v1, google } from 'googleapis';
import { inject, injectable } from 'inversify';
import GmailMessageData from '../types/gmailMessageData';
import GoogleOAuth2ClientProvider from '../../googleOAuth2/providers/googleOAuth2ClientProvider';
import { injectables } from '../../core/types/injectables';
import GoogleOAuth2Identifiers from '../../googleOAuth2/models/googleOAuth2Identifiers';
import { DependencyInjector } from '../../dependencyInjector';
import IUsesGoogleOAuth2 from '../../googleOAuth2/contracts/IUsesGoogleOAuth2';
import ILogger from '../../core/contracts/ILogger';

@injectable()
export default class GmailApiClient implements IUsesGoogleOAuth2 {
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';
    private readonly maxExponentialBackoffDepth: number = 4;

    private logger;
    private googleOAuth2ClientProvider: GoogleOAuth2ClientProvider;
    private gmail: gmail_v1.Gmail;

    private exponentialBackoffDepth = 0;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger
    ) {
        this.logger = logger;
        this.googleOAuth2ClientProvider = null!;
        this.gmail = null!;
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        this.googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateGmailServiceAsync(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);
        this.gmail = google.gmail({version: 'v1', auth: this.googleOAuth2ClientProvider.client});
    }

    public async * generateMessageIdsAsync(pageToken?: string): AsyncGenerator<string, [], undefined> {
        const { messages, nextPageToken } = await this.fetchMessagesAsync(pageToken);

        for (const messageItem of messages) {
            if (messageItem.id === null || messageItem.id === undefined) {
                this.logger.warn('Empty message id. Skipping...', { messageItem: JSON.stringify(messageItem) });

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
            await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId
            }));
    
        const message = messageResponse.data;

        const messageData = this.constructMessageData(message);
    
        return messageData;
    }
    
    public async fetchAttachmentDataAsync(messageData: GmailMessageData) {
        const response = await this.makeApiCallAsync(async () => 
            await this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageData.messageId,
                id: messageData.attachmentId
            }));

        const messagePartBody = response.data;
        const attachmentDataBase64 = String(messagePartBody.data);

        const attachmentData = this.decodeAttachmentData(attachmentDataBase64);
    
        return attachmentData;
    }
    
    private async fetchMessagesAsync(pageToken?: string) {
        this.logger.log(`Requesting messages...`);

        const response = await this.makeApiCallAsync(async () =>
            await this.gmail.users.messages.list({
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            }));

        const messageList = response.data;
        const messages = messageList.messages;
        const nextPageToken = messageList.nextPageToken;
    
        if (messages === undefined) {
            this.logger.warn(`Failed to get messages`);

            return { messages: [], nextPageToken: null };
        }
    
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
            this.logger.warn(`Gmail API call failed (${(ex as Error).message ?? ex}). Reattempting after ${this.exponentialBackoffDepth ** 2}s...`);
            
            result = await this.tryExponentialBackoffAsync(ex, async () => await this.makeApiCallAsync(apiCall));
        }

        return result;
    }

    private async tryExponentialBackoffAsync<T>(ex: unknown, operation: () => Promise<T>): Promise<T> {
        if (this.exponentialBackoffDepth > this.maxExponentialBackoffDepth) {
            this.exponentialBackoffDepth = 0;

            throw ex;
        }
        
        await new Promise(res => setTimeout(res, 2 ** this.exponentialBackoffDepth++ * 1000));

        const result = await operation();

        this.exponentialBackoffDepth = 0;

        return result;
    }

    private decodeAttachmentData(attachmentDataBase64: string) {
        const urlDecoded = this.base64UrlDecode(attachmentDataBase64);
    
        const base64Decoded = Buffer.from(urlDecoded, 'base64');
    
        const utf16Decoded = base64Decoded.toString('utf16le');
    
        return utf16Decoded;
    }

    private base64UrlDecode(input: string) {
        // Replace non-url compatible chars with base64 standard chars
        input = input
            .replace(/-/g, '+')
            .replace(/_/g, '/');
    
        // Pad out with standard base64 required padding characters
        const pad = input.length % 4;
        if (pad) {
            if (pad === 1) {
                throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
            }
            input += new Array(5 - pad).join('=');
        }
    
        return input;
    }
}