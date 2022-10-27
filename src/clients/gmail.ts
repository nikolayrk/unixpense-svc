import { gmail_v1 } from 'googleapis';
import exponentialBackoff from "../utils/exponentialBackoff";

export default class GmailClient {
    private readonly gmailApi: gmail_v1.Gmail;
    private readonly searchQuery: string = 'from:pb@unicreditgroup.bg subject: "Dvizhenie po smetka"';

    constructor(gmailApi: gmail_v1.Gmail) {
        this.gmailApi = gmailApi;
    }
    
    public async GetMessageListAsync(pageToken?: string): Promise<Array<gmail_v1.Schema$Message>> {
        const messagesResponse: any = await exponentialBackoff(0, this.gmailApi.users.messages.list.bind(this.gmailApi), {
            userId: 'me',
            q: this.searchQuery,
            pageToken: pageToken
        });
    
        const messages: Array<gmail_v1.Schema$Message> = messagesResponse.data.messages;
        const nextPageToken: string | undefined = messagesResponse.data.nextPageToken;
    
        if (messages === undefined) {
            return messages;
        }
    
        if(nextPageToken !== undefined) {
            const nextPageMessages: Array<gmail_v1.Schema$Message> = await this.GetMessageListAsync(nextPageToken);
    
            for(const messageIdx in nextPageMessages) {
                const message: gmail_v1.Schema$Message = nextPageMessages[messageIdx];
    
                messages.push(message);
            }
        }
    
        return messages;
    }
    
    public async GetMessageAsync(messageItem: any): Promise<gmail_v1.Schema$Message> {
        const messageResponse: any = await exponentialBackoff(0, this.gmailApi.users.messages.get.bind(this.gmailApi), {
            userId: 'me',
            id: messageItem.id
        });
    
        const message: gmail_v1.Schema$Message = messageResponse.data;
    
        return message;
    }
    
    public async GetAttachmentAsync(attachmentId: string, messageId: string) {
        const attachmentResponse: gmail_v1.Schema$MessagePartBody = await exponentialBackoff(0, this.gmailApi.users.messages.attachments.get.bind(this.gmailApi), {
            userId: 'me',
            messageId: messageId,
            id: attachmentId
        });
    
        const attachment = attachmentResponse.data;
    
        return attachment;
    }
}