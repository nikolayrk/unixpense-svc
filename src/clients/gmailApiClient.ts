import { gmail_v1, google } from 'googleapis';
import { inject, injectable } from 'inversify';
import GoogleOAuth2ClientProvider from '../providers/googleOAuth2ClientProvider';
import { injectables } from '../types/injectables';

@injectable()
export default class GmailApiClient {
    private readonly gmail: gmail_v1.Gmail;
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';

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
        const messageResponse = await this.exponentialBackoff(0, async () =>
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

        const response = await this.exponentialBackoff(0, async () => 
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
        const response = await this.exponentialBackoff(0, async () =>
            this.gmail.users.messages.list({
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
        const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

        try {
            return await fn(...params);
        } catch (e) {
            if (e instanceof Error && e.message === 'invalid_grant') {
                // TODO: Handle expired refresh tokens
                throw e;
            }

            if (depth > 7) {
                throw e;
            }
            await wait(2 ** depth * 1000); // [1s ... 64s]

            return this.exponentialBackoff(depth + 1, fn, ...params);
        }
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
}