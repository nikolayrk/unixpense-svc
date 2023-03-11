import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import base64UrlDecode from "../utils/base64UrlDecode";
import FailedToProcessTxnError from '../errors/failedToProcessTxnError';
import TransactionFactory from "../factories/transactionFactory";

export default class TransactionBuilder {
    private readonly gmailClient: GmailClient;
    private readonly transactionFactory: TransactionFactory;

    constructor(gmailClient: GmailClient, transactionFactory: TransactionFactory) {
        this.gmailClient = gmailClient;
        this.transactionFactory = transactionFactory;
    }

    public async buildAsync(messageItem: gmail_v1.Schema$Message) {
        const message = await this.constructMessageAsync(messageItem);

        try {
            const attachment = await this.constructAttachmentAsync(message);

            const decodedAttachment = this.decodeAttachment(attachment);

            const transaction = this.transactionFactory.create(message, decodedAttachment);

            return transaction;
        } catch (ex) {
            if (ex instanceof Error) {
                throw new FailedToProcessTxnError(`Failed to process transaction from message with ID ${message.id}: ${ex.stack}`);
            }
            
            throw new FailedToProcessTxnError(`Failed to process transaction from message with ID ${message.id}: ${ex}`);
        }
    }

    private async constructMessageAsync(messageItem: gmail_v1.Schema$Message) {
        console.log(`Requesting message ID ${messageItem.id}...`);

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