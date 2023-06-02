import { inject, injectable } from "inversify";
import GmailMessageData from "../models/gmailMessageData";
import ITransactionSourceProvider from "../../core/contracts/ITransactionSourceProvider";
import IUsesGoogleOAuth2 from "../../googleOAuth2/contracts/IUsesGoogleOAuth2";
import GmailApiClient from "../clients/gmailApiClient";
import { injectables } from "../../core/types/injectables";
import ILogger from "../../core/contracts/ILogger";
import GoogleOAuth2Identifiers from "../../googleOAuth2/models/googleOAuth2Identifiers";
import { DependencyInjector } from "../../dependencyInjector";

@injectable()
export default class GmailTransactionSourceProvider implements ITransactionSourceProvider, IUsesGoogleOAuth2 {
    private readonly logger;
    private gmailApiClient: GmailApiClient;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger
    ) {
        this.logger = logger;
        this.gmailApiClient = null!;
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        this.gmailApiClient = await DependencyInjector.Singleton.generateServiceAsync(injectables.GmailApiClientGenerator, identifiers);
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

        return gmailMessageData;
    }

    private async getAttachmentDataAsync(messageData: GmailMessageData) {
        this.logger.log(`Fetching Gmail attachment...`, { transactionId: messageData.messageId });

        const attachmentDataBase64 = await this.gmailApiClient.fetchAttachmentDataBase64Async(messageData);

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