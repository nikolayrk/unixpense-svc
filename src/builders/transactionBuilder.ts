import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from '../errors/failedToProcessTxnError';
import TransactionFactory from "../factories/transactionFactory";

export default class TransactionBuilder {
    private readonly gmailClient: GmailClient;
    private readonly transactionFactory: TransactionFactory;

    constructor(gmailClient: GmailClient, transactionFactory: TransactionFactory) {
        this.gmailClient = gmailClient;
        this.transactionFactory = transactionFactory;
    }

    public async tryBuildAsync(messageId: string) {
        try {
            const message = await this.constructMessageAsync(messageId);

            const attachmentData = await this.tryConstructAttachmentDataAsync(message);

            const transaction = this.transactionFactory.tryCreate(messageId, attachmentData);
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

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

        const message = await this.gmailClient.fetchMessageAsync(messageId);

        console.log(`Received message with ID ${message.id}`);

        return message;
    }

    private async tryConstructAttachmentDataAsync(message: gmail_v1.Schema$Message) {
        console.log(`Requesting attachment from message with ID ${message.id}...`);

        const attachmentDataBase64 = await this.gmailClient.tryFetchAttachmentDataBase64OrNullAsync(message);

        if (attachmentDataBase64 === null) {
            throw new Error(`Empty attachment data`);
        }

        console.log(`Received attachment from message with ID ${message.id}`);

        const decodedAttachmentData = this.decodeAttachmentData(attachmentDataBase64);

        return decodedAttachmentData;
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