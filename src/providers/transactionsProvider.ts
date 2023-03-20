import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import TransactionRepository from "../repositories/transactionRepository";

export default class TransactionsProvider {
    private readonly gmailClient: GmailClient;
    private readonly transactionBuilder: TransactionBuilder;
    private readonly transactionRepository: TransactionRepository;
    
    constructor(gmailClient: GmailClient, transactionBuilder: TransactionBuilder, transactionRepository: TransactionRepository) {
        this.gmailClient = gmailClient;
        this.transactionBuilder = transactionBuilder;
        this.transactionRepository = transactionRepository;
    }

    public async getTransactionsAsync(messageIdQuery?: string) {
        const transactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;

        for await (const transaction of this.generateTransactionsAsync(messageIdQuery)) {
            if (transaction === null) {
                continue;
            }

            transactions.push(transaction);
        }
        
        return transactions;
    }

    public async refreshTransactionsAsync(messageIdQuery?: string) {
        const transactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;
        let skippedCount = 0;

        for await (const transaction of this.generateNewTransactionsAsync(messageIdQuery)) {
            if (transaction === null) {
                skippedCount++;

                continue;
            }

            transactions.push(transaction);
        }
        
        const newCount = transactions.length;
        
        return { newCount, skippedCount };
    }

    private async * generateTransactionsAsync(messageIdQuery?: string) {
        for await (const messageId of this.generateMessageIdsAsync(messageIdQuery)) {
            const transaction = await this.getTransactionOrNullAsync(messageId);

            if (transaction === null) {
                yield null;

                continue;
            }

            yield transaction;
        }
    }

    private async * generateNewTransactionsAsync(messageIdQuery?: string) {
        for await (const messageId of this.generateMessageIdsAsync(messageIdQuery)) {
            if (await this.transactionExistsInDatabaseAsync(messageId)) {
                yield null;
                
                continue;
            }

            const transaction = await this.getTransactionOrNullAsync(messageId);

            if (transaction === null) {
                yield null;

                continue;
            }

            yield transaction;
        }
    }

    private generateMessageIdsAsync(messageIdQuery?: string) {
        return messageIdQuery !== undefined
            ? this.generateMessageIdsFromQuery(messageIdQuery)
            : this.gmailClient.tryGenerateMessageIdsAsync();
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
                console.log(ex.stack);

                return null;
            }

            throw ex;
        }
    }
    
    private async transactionExistsInDatabaseAsync(messageId: string) {
        return this.transactionRepository.findOrNullAsync(messageId) !== null;
    }
}