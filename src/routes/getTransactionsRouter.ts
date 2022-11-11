import express, { Request, Response } from "express";
import { gmail_v1 } from "googleapis";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";
import { gmailMessageListItemIterator, messageItemIterator } from "../utils/iterators";

export default function getTransactionsRoute(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
    const router = express.Router();

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageIdQuery = req.query.messageId?.toString();
        const transactions: Array<Transaction<TransactionType>> = new Array<Transaction<TransactionType>>;
        
        try {
            const iterator = messageIdQuery !== undefined
                ? messageItemIterator(messageIdQuery)
                : gmailMessageListItemIterator(gmailClient);

            for await (const messageItem of iterator) {
                try {
                    const transaction = await transactionBuilder.buildAsync(messageItem);
        
                    transactions.push(transaction);
                } catch(ex) {
                    if (ex instanceof FailedToProcessTxnError) {
                        console.log(ex.stack);
        
                        continue;
                    }
        
                    throw ex;
                }
            }

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
