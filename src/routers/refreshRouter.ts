import express, { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import TransactionRepository from "../repositories/transactionRepository";
import PaymentDetailsRepository from "../repositories/paymentDetailsRepository";
import TransactionType from "../enums/transactionType";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";

export default function refreshRouter(
    gmailClient: GmailClient,
    transactionBuilder: TransactionBuilder,
    transactionRepository: TransactionRepository,
    paymentDetailsRepository: PaymentDetailsRepository) {
    const router = express.Router();

    router.use('/refresh', async (_: Request, res: Response) => {
        let response;

        try {
            const { newTransactions, skippedTransactionsAmount } = await tryRefreshTransactionsAsync();

            response = skippedTransactionsAmount > 0
                ? `Added ${newTransactions.length} new transactions to database, skipped ${skippedTransactionsAmount}`
                : `Added ${newTransactions.length} new transactions to database`
        } catch (ex) {
            response = ex instanceof Error
                ? ex.stack
                : ex;
        }
                
        console.log(response);

        res.type('text/plain')
           .status(200)
           .send(response);
    });

    return router;

    async function tryRefreshTransactionsAsync() {
        const newTransactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;
        let skippedTransactionsAmount = 0;
        
        for await (const messageId of gmailClient.tryGenerateMessageIdsAsync()) {
    
            const transaction = await tryGetTransactionOrNullAsync(messageId);

            if (transaction === null) {
                skippedTransactionsAmount++;

                continue;
            }

            await addTransactionToDbAsync(transaction);

            newTransactions.push(transaction);
        }

        return { newTransactions, skippedTransactionsAmount };
    }

    async function tryGetTransactionOrNullAsync(messageId: string) {
        try {
            const transaction = await transactionBuilder.tryBuildAsync(messageId);

            return transaction;
        } catch(ex) {
            if (ex instanceof FailedToProcessTxnError) {
                console.log(ex.stack);

                return null;
            }

            throw ex;
        }
    }

    async function addTransactionToDbAsync(transaction: Transaction<PaymentDetails>) {
        const transactionExistsInDb = await transactionRepository.findOrNullAsync(transaction.messageId) !== null;
                
        if (transactionExistsInDb) {
            console.log(`Message with ID ${transaction.messageId} already exists. Skipping...`);
    
            return;
        }
    
        await transactionRepository.createAsync(transaction);
    
        if (transaction.type !== TransactionType.UNKNOWN) {
            await paymentDetailsRepository.createAsync(transaction.messageId, transaction.type, transaction.paymentDetails);
        }
    
        console.log(`Successfully added transaction with reference ${transaction.reference} of type ${TransactionTypeExtensions.ToString(transaction.type)} to database`);    
    }
}
