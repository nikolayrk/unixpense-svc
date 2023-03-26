import { gmail_v1, google } from 'googleapis';
import { inject, injectable } from 'inversify';
import GoogleOAuth2ClientProvider from '../providers/googleOAuth2ClientProvider';
import { injectables } from '../types/injectables';

@injectable()
export default class GmailApiClient {
    private readonly gmail: gmail_v1.Gmail;
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';
    private readonly maxExponentialBackoffDepth: number = 7;

    private exponentialBackoffDepth = 0;

    public constructor(
        @inject(injectables.GoogleOAuth2ClientProvider) googleOAuth2ClientProvider: GoogleOAuth2ClientProvider
    ) {
        this.gmail = google.gmail({version: 'v1', auth: googleOAuth2ClientProvider.get});
    }

    public async * tryGenerateMessageIdsAsync(pageToken?: string): AsyncGenerator<string, string | [], unknown> {
        const messageList = await this.fetchMessageListAsync(pageToken);
        const messages = this.getMessagesFromListOrNull(messageList);

        if (messages === null) {
            return [];
        }

        for (const messageIdx in messages) {
            const messageItem = messages[messageIdx];

            if (messageItem.id === null || messageItem.id === undefined) {
                console.log('Empty message id. Skipping...');

                continue;
            }
            
            yield messageItem.id;
        }

        const nextPageToken = messageList.nextPageToken;

        if (nextPageToken !== null) {
            yield * this.tryGenerateMessageIdsAsync(nextPageToken);
        }

        return [];
    }
    
    public async fetchMessageAsync(messageId: string) {
        const messageResponse = await this.makeApiCallAsync(async () =>
            this.gmail.users.messages.get({
                userId: 'me',
                id: messageId
            }));
    
        const message = messageResponse.data;
    
        return message;
    }
    
    public async tryFetchAttachmentDataBase64OrNullAsync(message: gmail_v1.Schema$Message) {
        const attachmentId = message
            .payload
           ?.parts
           ?.[1]
           ?.body
           ?.attachmentId;

        if (attachmentId === null || attachmentId === undefined) {
            throw new Error(`No attachment ID found`);
        }

        const response = await this.makeApiCallAsync(async () => 
            this.gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: message.id as string,
                id: attachmentId
            }));

        const messagePartBody = response.data;
        const attachmentDataBase64 = messagePartBody.data;

        if (attachmentDataBase64 === undefined) {
            throw new Error(`No attachment data found`);
        }
    
        return attachmentDataBase64;
    }
    
    private async fetchMessageListAsync(pageToken?: string | undefined) {
        const response = await this.makeApiCallAsync(async () =>
            this.gmail.users.messages.list({
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            }));

        const messageList = response.data;
    
        return messageList;
    }
    
    private getMessagesFromListOrNull(messageList: gmail_v1.Schema$ListMessagesResponse) {
        const messages = messageList.messages;
        const nextPageToken = messageList.nextPageToken;
    
        console.log(`Requesting message list${nextPageToken !== undefined ? ` with page token ${nextPageToken}` : ''}`);
    
        if (messages === undefined) {
            console.log(`Failed to get message list`);

            return null;
        }
    
        console.log(`Received page of ${messages.length} messages`);
    
        return messages;
    }

    private async makeApiCallAsync<T>(apiCall: () => T): Promise<T> {
        let result;

        try {
            result = await apiCall();
        } catch(ex) {
            result = await this.tryExponentialBackoffAsync(ex, () => this.makeApiCallAsync(apiCall));

            return result;
        }

        return result;
    }

    private async tryExponentialBackoffAsync<T>(ex: unknown, operation: () => T): Promise<T> {
        if (this.exponentialBackoffDepth++ > this.maxExponentialBackoffDepth) {
            this.exponentialBackoffDepth = 0;

            throw ex;
        }
        
        await new Promise(res => setTimeout(res, 2 ** this.exponentialBackoffDepth * 1000));

        const result = await operation();

        this.exponentialBackoffDepth = 0;

        return result;
    }
}