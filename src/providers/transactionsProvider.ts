import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default class TransactionsProvider {
    private readonly gmailClient: GmailClient;
    private readonly transactionBuilder: TransactionBuilder;
    
    constructor(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
        this.gmailClient = gmailClient;
        this.transactionBuilder = transactionBuilder;
    }

    public async getTransactionsAsync(messageIdQuery?: string) {
        const transactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;

        for await (const transaction of this.generateTransactionOrNull(messageIdQuery)) {
            if (transaction === null) {
                continue;
            }

            transactions.push(transaction);
        }

        return transactions;
    }

    private async * generateTransactionOrNull(messageIdQuery?: string) {
        const iterator = messageIdQuery !== undefined
            ? this.generateMessageIdsFromQuery(messageIdQuery)
            : this.gmailClient.tryGenerateMessageIdsAsync();
        
        for await (const messageId of iterator) {
    
            const transaction = await this.getTransactionOrNullAsync(messageId);

            if (transaction === null) {
                yield null;

                continue;
            }

            yield transaction;
        }
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
}