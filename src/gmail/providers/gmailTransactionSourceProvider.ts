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
        this.gmailApiClient = await DependencyInjector.Singleton.generateGmailServiceAsync(injectables.GmailApiClientGenerator, identifiers);
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

        const attachmentData = await this.gmailApiClient.fetchAttachmentDataAsync(messageData);

        return attachmentData;
    }
}