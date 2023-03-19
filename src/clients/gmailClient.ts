import { gmail_v1, google } from 'googleapis';
import OAuth2ClientProvider from '../providers/oauth2ClientProvider';

export default class GmailClient {
    private readonly gmailApi: gmail_v1.Gmail;
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';

    constructor(oauth2ClientProvider: OAuth2ClientProvider) {
        const gmailApi = google.gmail({version: 'v1', auth: oauth2ClientProvider.oauth2Client});

        this.gmailApi = gmailApi;
    }

    public async * tryGenerateMessageIdsAsync(pageToken?: string): AsyncGenerator<string, any, unknown> {
        const messageList = await this.fetchMessageListAsync(pageToken);
        const messages = this.tryGetMessagesFromList(messageList);

        for (const messageIdx in messages) {
            const messageItem = messages[messageIdx];

            if (messageItem.id === null || messageItem.id === undefined) {
                throw new Error('Empty message id');
            }
            
            yield messageItem.id;
        }

        const nextPageToken = messageList.nextPageToken;

        if (nextPageToken !== null) {
            yield * this.tryGenerateMessageIdsAsync(nextPageToken);
        }
    }
    
    public async fetchMessageAsync(messageId: string) {
        const messageResponse = await this.exponentialBackoff(0, async () =>
            this.gmailApi.users.messages.get({
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

        const response = await this.exponentialBackoff(0, async () => 
            this.gmailApi.users.messages.attachments.get({
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
        const response = await this.exponentialBackoff(0, async () =>
            this.gmailApi.users.messages.list({
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            }));

        const messageList = response.data;
    
        return messageList;
    }

    /**
     * https://developers.google.com/gmail/api/guides/handle-errors#exponential-backoff
     */
    private async exponentialBackoff<TResult>(depth: number = 0, fn: (...p: any[]) => TResult, ...params: any[]): Promise<TResult> {
        const wait = (ms: number): Promise<NodeJS.Timeout> => new Promise((res) => setTimeout(res, ms));

        try {
            return await fn(...params);
        } catch (e) {
            if (depth > 7) {
                throw e;
            }
            await wait(2 ** depth * 1000); // [1s ... 64s]

            return this.exponentialBackoff(depth + 1, fn, ...params);
        }
    }
    
    private tryGetMessagesFromList(messageList: gmail_v1.Schema$ListMessagesResponse) {
        const messages = messageList.messages;
        const nextPageToken = messageList.nextPageToken;
    
        console.log(`Requesting message list${nextPageToken !== undefined ? ` with page token ${nextPageToken}` : ''}`);
    
        if (messages === undefined) {
            throw new Error(`Failed to get message list`);
        }
    
        console.log(`Received page of ${messages.length} messages`);
    
        return messages;
    }
}