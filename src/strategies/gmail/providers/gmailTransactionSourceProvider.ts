import { inject, injectable } from "inversify";
import GmailApiClient from "../clients/gmailApiClient";
import ITransactionDataProvider from "../../../contracts/ITransactionDataProvider";
import ITransactionSourceProvider from "../../../contracts/ITransactionSourceProvider";
import GmailMessageData from "../models/gmailMessageData";
import { injectables } from "../../../types/injectables";

@injectable()
export default class GmailTransactionSourceProvider implements ITransactionSourceProvider {
    private readonly gmailApiClient;
    private readonly transactionDataProvider;

    public constructor(
        @inject(injectables.GmailApiClient)
        gmailApiClient: GmailApiClient,

        @inject(injectables.ITransactionDataProvider)
        transactionDataProvider: ITransactionDataProvider
    ) {
        this.gmailApiClient = gmailApiClient;
        this.transactionDataProvider = transactionDataProvider;
    }

    public generateTransactionIdsAsync() {
        return this.gmailApiClient.generateMessageIdsAsync();
    }
    
    public async getTransactionDataAsync(transactionId: string) {
        const messageData = await this.getGmailMessageDataAsync(transactionId);

        const attachmentData = await this.getAttachmentDataAsync(messageData);

        const transactionData = this.transactionDataProvider.get(attachmentData);
        
        return transactionData;
    }

    private async getGmailMessageDataAsync(transactionId: string) {
        console.log(`Requesting transaction with ID ${transactionId}...`);

        const gmailMessageData = await this.gmailApiClient.fetchMessageDataAsync(transactionId);

        console.log(`Received transaction with ID ${transactionId}`);

        return gmailMessageData;
    }

    private async getAttachmentDataAsync(messageData: GmailMessageData) {
        console.log(`Requesting attachment from message with ID ${messageData.messageId}...`);

        const attachmentDataBase64 = await this.gmailApiClient.fetchAttachmentDataBase64Async(messageData);

        console.log(`Received attachment from message with ID ${messageData.messageId}`);

        const attachmentData = this.decodeAttachmentData(attachmentDataBase64);

        return attachmentData;
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