import express, { Request, Response } from "express";
import TransactionContext from "../contexts/transactionContext";
import { DependencyInjector } from "../dependencyInjector";
import { injectables } from "../types/injectables";

export default function getTransactionsRouter() {
    const router = express.Router();

    const transactionContext = DependencyInjector.Singleton.resolve<TransactionContext>(injectables.TransactionContext);

    router.use('/gettransactions', async (req: Request, res: Response) => {
        const transactionIdsQuery = req.query.transactionId?.toString();
        let response;
        
        try {
            const transactions = [];

            for await (const transactionOrNull of transactionContext.generateAsync(transactionIdsQuery)) {
                if (transactionOrNull === null) {
                    continue;
                }

                transactions.push(transactionOrNull);
            }

            response = JSON.stringify(transactions, null, 2);
        } catch (ex) {
            response = ex instanceof Error
                ? `${ex.message}\n\n${ex.stack}`
                : ex;
        }

        res.type('text/plain')
           .status(200)
           .end(response);
    });

    return router;
}
