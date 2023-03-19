import express, { Request, Response } from "express";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";
import FailedToProcessTxnError from "../errors/failedToProcessTxnError";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";

export default function getTransactionsRouter(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
    const router = express.Router();

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageIdQuery = req.query.messageId?.toString();
        let response;
        
        try {
            const transactions = await tryGetTransactionsAsync(messageIdQuery);

            response = JSON.stringify(transactions, null, 2);
        } catch (ex) {
            response = ex instanceof Error
                ? ex.stack
                : ex;
        }

        res.type('text/plain')
           .status(200)
           .send(response);
    });

    return router;

    async function tryGetTransactionsAsync(messageIdQuery?: string) {
        const transactions: Array<Transaction<PaymentDetails>> = new Array<Transaction<PaymentDetails>>;

        const iterator = messageIdQuery !== undefined
            ? generateMessageIdsFromQuery(messageIdQuery)
            : gmailClient.tryGenerateMessageIdsAsync();

        for await (const messageId of iterator) {
            const transaction = await tryGetTransactionOrNullAsync(messageId);

            if (transaction === null) {
                continue;
            }

            transactions.push(transaction);
        }

        return transactions;
    }

    function * generateMessageIdsFromQuery(messageIdsQuery: string) {
        const messageIds = messageIdsQuery.split(',');
    
        for (const idx in messageIds) {
            const messageId = messageIds[idx];
    
            yield messageId;
        }
    }

    async function tryGetTransactionOrNullAsync(messageId:string) {
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
}
