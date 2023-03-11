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

    public async buildAsync(messageId: string) {
        try {
            const message = await this.constructMessageAsync(messageId);

            const attachment = await this.constructAttachmentAsync(message);

            const decodedAttachment = this.decodeAttachment(attachment);

            const transaction = this.transactionFactory.create(messageId, decodedAttachment);

            return transaction;
        } catch (ex) {
            const body = ex instanceof Error
                ? ex.stack
                : ex;
            
            throw new FailedToProcessTxnError(`Failed to process transaction from message with ID ${messageId}: ${body}`);
        }
    }

    private async constructMessageAsync(messageId: string) {
        console.log(`Requesting message ID ${messageId}...`);

        const message = await this.gmailClient.getMessageAsync(messageId);

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