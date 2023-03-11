import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import exponentialBackoff from "../utils/exponentialBackoff";

export default class GmailClient {
    private readonly gmailApi: gmail_v1.Gmail;
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';

    constructor(oauth2Client: OAuth2Client) {
        const gmailApi = google.gmail({version: 'v1', auth: oauth2Client});

        this.gmailApi = gmailApi;
    }

    public async * tryGenerateMessageIdsAsync(pageToken?: string | null): AsyncGenerator<string, any, unknown> {
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

        if (nextPageToken !== undefined) {
            yield * this.tryGenerateMessageIdsAsync(nextPageToken);
        }
    }
    
    public async fetchMessageAsync(messageId: string) {
        const messageResponse: any = await exponentialBackoff(0,
            this.gmailApi.users.messages.get.bind(this.gmailApi), {
                userId: 'me',
                id: messageId
            });
    
        const message: gmail_v1.Schema$Message = messageResponse.data;
    
        return message;
    }
    
    public async tryFetchAttachmentAsync(message: gmail_v1.Schema$Message) {
        const attachmentId = message.payload?.parts?.[1].body?.attachmentId;

        if (attachmentId === null || attachmentId === undefined) {
            throw new Error(`No attachment ID found`);
        }

        const attachmentResponse: any = await exponentialBackoff(0,
            this.gmailApi.users.messages.attachments.get.bind(this.gmailApi), {
                userId: 'me',
                messageId: message.id,
                id: attachmentId
            });
    
        const messagePartBody: gmail_v1.Schema$MessagePartBody = attachmentResponse.data;

        const attachment = messagePartBody.data;
    
        return attachment;
    }
    
    private async fetchMessageListAsync(pageToken?: string | null | undefined) {
        const response: any = await exponentialBackoff(0,
            this.gmailApi.users.messages.list.bind(this.gmailApi), {
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            });

        const messageList: gmail_v1.Schema$ListMessagesResponse = response.data;
    
        return messageList;
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