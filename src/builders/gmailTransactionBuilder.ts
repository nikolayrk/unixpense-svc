import { gmail_v1 } from "googleapis";
import { inject, injectable } from "inversify";
import GmailApiClient from "../clients/gmailApiClient";
import ITransactionBuilder from "../contracts/ITransactionBuilder";
import ITransactionFactory from "../contracts/ITransactionFactory";
import FailedToProcessTxnError from '../errors/failedToProcessTxnError';
import { injectables } from "../types/injectables";

@injectable()
export default class GmailTransactionBuilder implements ITransactionBuilder {
    private readonly gmailApiClient: GmailApiClient;
    private readonly transactionFactory: ITransactionFactory;

    public constructor(
        @inject(injectables.GmailApiClient) gmailApiClient: GmailApiClient,
        @inject(injectables.ITransactionFactory) transactionFactory: ITransactionFactory
    ) {
        this.gmailApiClient = gmailApiClient;
        this.transactionFactory = transactionFactory;
    }

    public async tryBuildAsync(messageId: string) {
        try {
            const message = await this.constructMessageAsync(messageId);

            const attachmentData = await this.tryConstructAttachmentDataAsync(message);

            const transaction = this.transactionFactory.create(messageId, attachmentData);
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

            return transaction;
        } catch (ex) {            
            const message = ex instanceof Error
                ? ex.message
                : ex as string;

            throw new FailedToProcessTxnError(messageId, message);
        }
    }

    private async constructMessageAsync(messageId: string) {
        console.log(`Requesting message ID ${messageId}...`);

        const message = await this.gmailApiClient.fetchMessageAsync(messageId);

        console.log(`Received message with ID ${message.id}`);

        return message;
    }

    private async tryConstructAttachmentDataAsync(message: gmail_v1.Schema$Message) {
        console.log(`Requesting attachment from message with ID ${message.id}...`);

        const attachmentDataBase64 = await this.gmailApiClient.tryFetchAttachmentDataBase64OrNullAsync(message);

        if (attachmentDataBase64 === null) {
            throw new FailedToProcessTxnError(message.id as string, `Empty attachment data`);
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