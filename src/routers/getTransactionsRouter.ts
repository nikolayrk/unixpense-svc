import express, { Request, Response } from "express";
import ITransactionProvider from "../contracts/ITransactionProvider";
import { DependencyInjector } from "../dependencyInjector";
import { injectables } from "../types/injectables";

export default function getTransactionsRouter() {
    const router = express.Router();

    const transactionProvider = DependencyInjector.Singleton.resolve<ITransactionProvider>(injectables.ITransactionProvider);

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const messageIdQuery = req.query.messageId?.toString();
        let response;
        
        try {
            const transactions = [];

            for await (const transaction of transactionProvider.generateAsync(messageIdQuery)) {
                if (transaction === null) {
                    continue;
                }

                transactions.push(transaction);
            }

            response = JSON.stringify(transactions, null, 2);
        } catch (ex) {
            response = ex instanceof Error
                ? `${ex.message}\n\n${ex.stack}`
                : ex;
        }

        res.type('text/plain')
           .status(200)
           .send(response);
    });

    return router;
}
