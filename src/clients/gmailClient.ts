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
    
    public async* getMessageListAsync(pageToken?: string) {
        const response: any = await exponentialBackoff(0,
            this.gmailApi.users.messages.list.bind(this.gmailApi), {
                userId: 'me',
                q: this.searchQuery,
                pageToken: pageToken
            });

        const messageListResponse: gmail_v1.Schema$ListMessagesResponse = response.data;
        const nextPageToken = messageListResponse.nextPageToken;
    
        yield messageListResponse;
    }
    
    public async getMessageAsync(messageItem: gmail_v1.Schema$Message) {
        const messageResponse: any = await exponentialBackoff(0,
            this.gmailApi.users.messages.get.bind(this.gmailApi), {
                userId: 'me',
                id: messageItem.id
            });
    
        const message: gmail_v1.Schema$Message = messageResponse.data;
    
        return message;
    }
    
    public async getAttachmentAsync(message: gmail_v1.Schema$Message) {
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
}