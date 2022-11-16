import express, { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import { gmailMessageListItemIterator, messageItemIterator } from "../utils/iterators";
import TransactionRepository from "../repositories/transactionRepository";
import PaymentDetailsRepository from "../repositories/paymentDetailsRepository";
import { Sequelize } from "sequelize-typescript";

export default function getTransactionsRouter(
    gmailClient: GmailClient,
    transactionBuilder: TransactionBuilder,
    dbConnection: Sequelize,
    transactionRepository: TransactionRepository,
    paymentDetailsRepository: PaymentDetailsRepository) {
    const router = express.Router();

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageIdQuery = req.query.messageId?.toString();
        const transactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;
        
        try {
            const iterator = messageIdQuery !== undefined
                ? messageItemIterator(messageIdQuery)
                : gmailMessageListItemIterator(gmailClient);

            for await (const messageItem of iterator) {
                try {
                    const transaction = await transactionBuilder.buildAsync(messageItem);

                    await transactionRepository.createAsync(transaction);

                    await paymentDetailsRepository.createAsync(transaction.messageId, transaction.type, transaction.paymentDetails);
        
                    transactions.push(transaction);
                } catch(ex) {
                    if (ex instanceof FailedToProcessTxnError) {
                        console.log(ex.stack);
        
                        continue;
                    }
        
                    throw ex;
                }
            }            

            dbConnection.sync();

            res.send(transactions);
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
