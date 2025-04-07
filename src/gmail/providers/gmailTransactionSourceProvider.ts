import { inject, injectable } from "inversify";
import GmailMessageData from "../types/gmailMessageData";
import GmailApiClient from "../clients/gmailApiClient";
import { injectables } from "../../core/types/injectables";
import ILogger from "../../core/contracts/ILogger";
import { DependencyInjector } from "../../dependencyInjector";
import IGmailTransactionSourceProvider from "../contracts/IGmailTransactionSourceProvider";

@injectable()
export default class GmailTransactionSourceProvider implements IGmailTransactionSourceProvider {
    private readonly logger;
    private gmailApiClient: GmailApiClient;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger
    ) {
        this.logger = logger;
        this.gmailApiClient = null!;
    }

    public authenticate(accessToken: string): void {
        this.gmailApiClient = DependencyInjector.Singleton.resolve<GmailApiClient>(injectables.GmailApiClient);
        this.gmailApiClient.authenticate(accessToken);
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