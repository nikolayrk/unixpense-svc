import express, { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";
import { transactionIterator } from "../utils/transactionIterator";

export default function getTransactionsRoute(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
    const router = express.Router();

    router.use(async (req: Request, res: Response) => {
        try {
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
