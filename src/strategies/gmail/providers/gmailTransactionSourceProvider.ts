import { inject, injectable } from "inversify";
import GmailApiClient from "../clients/gmailApiClient";
import ITransactionSourceProvider from "../../../contracts/ITransactionSourceProvider";
import GmailMessageData from "../models/gmailMessageData";
import { injectables } from "../../../types/injectables";
import ILogger from "../../../contracts/ILogger";

@injectable()
export default class GmailTransactionSourceProvider implements ITransactionSourceProvider {
    private readonly logger;
    private readonly gmailApiClient;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

        @inject(injectables.GmailApiClient)
        gmailApiClient: GmailApiClient
    ) {
        this.logger = logger;
        this.gmailApiClient = gmailApiClient;
    }

    public generateTransactionIdsAsync() {
        return this.gmailApiClient.generateMessageIdsAsync();
    }
    
    public async getAsync(transactionId: string) {
        const messageData = await this.getGmailMessageDataAsync(transactionId);

        const attachmentData = await this.getAttachmentDataAsync(messageData);
        
        return attachmentData;
    }

    private async getGmailMessageDataAsync(transactionId: string) {
        this.logger.log(`Fetching Gmail message...`, { transactionId: transactionId });

        const gmailMessageData = await this.gmailApiClient.fetchMessageDataAsync(transactionId);

        this.logger.log(`Received Gmail message`, { transactionId: transactionId });

        return gmailMessageData;
    }

    private async getAttachmentDataAsync(messageData: GmailMessageData) {
        this.logger.log(`Fetching attachment...`, { transactionId: messageData.messageId });

        const attachmentDataBase64 = await this.gmailApiClient.fetchAttachmentDataBase64Async(messageData);

        this.logger.log(`Received attachment`, { transactionId: messageData.messageId });

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