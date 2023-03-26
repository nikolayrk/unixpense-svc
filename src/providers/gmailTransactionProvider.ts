import { inject, injectable } from "inversify";
import GmailApiClient from "../clients/gmailApiClient";
import ITransactionBuilder from "../contracts/ITransactionBuilder";
import ITransactionProvider from "../contracts/ITransactionProvider";
import ITransactionRepository from "../contracts/ITransactionRepository";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import { injectables } from "../types/injectables";

@injectable()
export default class GmailTransactionProvider implements ITransactionProvider {
    private readonly gmailApiClient!: GmailApiClient;
    private readonly transactionBuilder!: ITransactionBuilder;
    private readonly transactionRepository!: ITransactionRepository;

    public constructor(
        @inject(injectables.GmailApiClient) gmailApiClient: GmailApiClient,
        @inject(injectables.ITransactionBuilder) transactionBuilder: ITransactionBuilder,
        @inject(injectables.ITransactionRepository) transactionRepository: ITransactionRepository,
    ) {
        this.gmailApiClient = gmailApiClient;
        this.transactionBuilder = transactionBuilder;
        this.transactionRepository = transactionRepository;
    }

    public async * generateAsync(messageIdQuery?: string) {
        for await (const messageId of this.generateMessageIdsAsync(messageIdQuery)) {
            const transaction = await this.getTransactionOrNullAsync(messageId);

            yield transaction;
        }

        return [];
    }

    public async * generateSaveAsync() {
        for await (const messageId of this.generateMessageIdsAsync()) {
            if (await this.transactionExistsAsync(messageId)) {
                console.log(`Transaction from message ID ${messageId} already exists`);

                yield null;
                
                continue;
            }

            const transaction = await this.getTransactionOrNullAsync(messageId);

            if (transaction === null) {
                yield null;

                continue;
            }

            await this.addTransactionAsync(transaction);

            yield transaction;
        }

        return [];
    }

    private generateMessageIdsAsync(messageIdQuery?: string) {
        return messageIdQuery !== undefined
            ? this.generateMessageIdsFromQuery(messageIdQuery)
            : this.gmailApiClient.tryGenerateMessageIdsAsync();
    }

    private * generateMessageIdsFromQuery(messageIdsQuery: string) {
        const messageIds = messageIdsQuery.split(',');
    
        for (const idx in messageIds) {
            const messageId = messageIds[idx];
    
            yield messageId;
        }
    }

    private async getTransactionOrNullAsync(messageId: string) {
        try {
            const transaction = await this.transactionBuilder.tryBuildAsync(messageId);

            return transaction;
        } catch(ex) {
            if (ex instanceof FailedToProcessTxnError) {
                console.log(`${ex.message}\n\n${ex.stack}`);

                return null;
            }

            throw ex;
        }
    }

    private async transactionExistsAsync(messageId: string) { 
        return this.transactionRepository.existsAsync(messageId);
    }

    private async addTransactionAsync(transaction: Transaction<PaymentDetails>) {
        console.log(`Adding transaction with message ID ${transaction.messageId} of type ${TransactionTypeExtensions.ToString(transaction.type)} to database`);

        await this.transactionRepository.createAsync(transaction);
        
        console.log(`Successfully added transaction with message ID ${transaction.messageId}`);
    }
}