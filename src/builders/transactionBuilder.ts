import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import TransactionFactory from "../factories/transactionFactory";
import base64UrlDecode from "../utils/base64UrlDecode";

export default class TransactionBuilder {
    private gmailClient: GmailClient;
    private transactionFactory: TransactionFactory

    constructor(gmailClient: GmailClient, transactionFactory: TransactionFactory) {
        this.gmailClient = gmailClient;
        this.transactionFactory = transactionFactory;
    }

    public async* buildAsync() {
        for await (const messageListPage of this.gmailClient.getMessageListAsync()) {
            const messageList = await this.constructMessageList(messageListPage);

            await (yield* this.constructTransactionAsync(messageList));            
        }
    }

    private async constructMessageList(messageListPage: gmail_v1.Schema$ListMessagesResponse) {
        const messageList = messageListPage.messages;
        const nextPageToken = messageListPage.nextPageToken;

        console.log(`Requesting message list${nextPageToken !== undefined ? ` with page token ${nextPageToken}` : ''}`);

        if (messageList === undefined) {
            throw new Error(`Failed to get message list`);
        }

        console.log(`Received page of ${messageList.length} messages`);

        return messageList;
    }

    private async* constructTransactionAsync(messageList: gmail_v1.Schema$Message[]) {
        for (const messageIdx in messageList) {
            const messageItem = messageList[messageIdx];

            const message = await this.constructMessageAsync(messageItem, messageIdx);

            try {
                const attachment = await this.constructAttachmentAsync(message);

                const decodedAttachment = this.decodeAttachment(attachment);

                console.log(`Processing transaction from message with ID ${message.id}`);

                const transaction = this.transactionFactory.create(message, decodedAttachment);

                console.log(`Successfully processed transaction with reference ${transaction.reference}`);

                yield transaction;
            } catch (ex) {
                if (ex instanceof Error) {
                    console.log(`Failed to process transaction from message with ID ${message.id}: ${ex.stack}`);
                }
            }
        }
    }

    private async constructMessageAsync(messageItem: gmail_v1.Schema$Message, messageIdx: string) {
        console.log(`Requesting message #${messageIdx} with ID ${messageItem.id}...`);

        const message = await this.gmailClient.getMessageAsync(messageItem);

        console.log(`Received message with ID ${message.id}`);

        return message;
    }

    private async constructAttachmentAsync(message: gmail_v1.Schema$Message) {
        console.log(`Requesting attachment from message with ID ${message.id}...`);

        const attachment = await this.gmailClient.getAttachmentAsync(message);

        if (attachment === null || attachment === undefined) {
            throw new Error(`Missing attachment`);
        }

        console.log(`Received attachment from message with ID ${message.id}`);

        return attachment;
    }

    private decodeAttachment(attachment: string) {
        const urlDecoded = base64UrlDecode(attachment);
    
        const base64Decoded = Buffer.from(urlDecoded, 'base64');
    
        const utf16Decoded = base64Decoded.toString('utf16le');
    
        return utf16Decoded;
    }
}