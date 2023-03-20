import express, { Request, Response } from "express";
import TransactionRepository from "../repositories/transactionRepository";
import TransactionsProvider from "../providers/transactionsProvider";

export default function refreshRouter(
    transactionsProvider: TransactionsProvider,
    transactionRepository: TransactionRepository) {
    const router = express.Router();

    router.use('/refresh', async (_: Request, res: Response) => {
        let response;

        try {
            const { newTransactions, skipped } = await tryRefreshTransactionsAsync();

            response = skipped > 0
                ? `Added ${newTransactions.length} new transactions to database, skipped ${skipped}`
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
        const transactions = await transactionsProvider.getTransactionsAsync();
        
        const newTransactions = transactions
            .filter(t => t !== null);

        const failedCount = transactions
            .filter(t => t === null)
            .length;

        const existingCount = newTransactions
            .filter(async transaction => await transactionRepository.createAsync(transaction))
            .length;

        const skipped = failedCount + existingCount;

        return { newTransactions, skipped };
    }
}
