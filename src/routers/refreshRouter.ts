import express, { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import TransactionRepository from "../repositories/transactionRepository";
import PaymentDetailsRepository from "../repositories/paymentDetailsRepository";
import { Sequelize } from "sequelize-typescript";
import { gmailNewMessageListItemIterator } from "../utils/iterators";
import addTransactionToDatabase from "../utils/addTransactionToDatabase";

export default function refreshRouter(
    gmailClient: GmailClient,
    transactionBuilder: TransactionBuilder,
    dbConnection: Sequelize,
    transactionRepository: TransactionRepository,
    paymentDetailsRepository: PaymentDetailsRepository) {
    const router = express.Router();

    router.use('/refresh', async (req: Request, res: Response) => {
        const newTransactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;

        let skippedTransactionsAmount = 0;
        
        try {
            const newMessages = gmailNewMessageListItemIterator(gmailClient, transactionRepository);

            for await (const messageItem of newMessages) {
                try {
                    const transaction = await transactionBuilder.buildAsync(messageItem);

                    if (await transactionRepository.tryFindAsync(transaction.messageId) !== null) {
                        console.log(`${transaction.messageId} already exists in database. Skipping...`);

                        skippedTransactionsAmount++;

                        continue;
                    }

                    await addTransactionToDatabase(transaction, transactionRepository, paymentDetailsRepository);
        
                    newTransactions.push(transaction);
                } catch(ex) {
                    if (ex instanceof FailedToProcessTxnError) {
                        console.log(ex.stack);

                        skippedTransactionsAmount++;
        
                        continue;
                    }
        
                    throw ex;
                }
            }            

            dbConnection.sync();

            res.send(`Added ${newTransactions.length} new transactions to database${ skippedTransactionsAmount > 0 ? `, skipped ${skippedTransactionsAmount}` : '' }`);
        } catch (ex) {
            if (ex instanceof Error) {
                console.log(ex.stack);

                res.send(ex.message);

                return;
            }

            res.send(ex);

            return;
        }
    });

    return router;
}
