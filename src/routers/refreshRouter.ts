import express, { Request, Response } from "express";
import TransactionsProvider from "../providers/transactionsProvider";

export default function refreshRouter(
    transactionsProvider: TransactionsProvider) {
    const router = express.Router();

    router.use('/refresh', async (_: Request, res: Response) => {
        let response;

        try {
            const { newCount, skippedCount } = await transactionsProvider.refreshTransactionsAsync();

            response = skippedCount > 0
                ? `Added ${newCount} new transactions to database, skipped ${skippedCount}`
                : `Added ${newCount} new transactions to database`
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
}
