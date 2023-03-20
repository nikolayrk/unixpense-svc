import express, { Request, Response } from "express";
import TransactionsProvider from "../providers/transactionsProvider";

export default function getTransactionsRouter(transactionsProvider: TransactionsProvider) {
    const router = express.Router();

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageIdQuery = req.query.messageId?.toString();
        let response;
        
        try {
            const transactions = await transactionsProvider.getTransactionsAsync(messageIdQuery);

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
}
