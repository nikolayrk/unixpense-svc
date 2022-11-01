import express, { Request, Response } from "express";
import { gmail_v1 } from "googleapis";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";
import transactionIterator from "../utils/transactionIterator";

export default function getTransactionsRoute(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
    const router = express.Router();

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageId = req.query.messageId?.toString();
        
        try {
            if (messageId !== undefined) {
                const messageItem: gmail_v1.Schema$Message = {
                    id: messageId,
                };

                const transaction = (await transactionBuilder.buildAsync(messageItem).next()).value;

                if (transaction === undefined) {
                    res.send(`Failed to get transaction from message ${messageId}`);

                    return;
                }

                res.send(transaction);

                return;
            }

            const transactions: Array<Transaction<TransactionType>> = [];

            for await (const transaction of transactionIterator(gmailClient, transactionBuilder)) {
                transactions.push(transaction);
            }

            res.send(transactions);
        } catch (ex) {
            if (ex instanceof Error) {
                console.log(ex.stack);

                res.send(ex.stack);
            }

            return;
        }
    });

    return router;
}
