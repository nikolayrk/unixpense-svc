import express, { Request, Response } from "express";
import TransactionContext from "../contexts/transactionContext";
import { DependencyInjector } from "../dependencyInjector";
import { injectables } from "../types/injectables";

export default function refreshRouter() {
    const router = express.Router();

    const transactionContext = DependencyInjector.Singleton.resolve<TransactionContext>(injectables.TransactionContext);
    
    router.use('/refresh', async (_: Request, res: Response) => {
        let response;

        try {
            const newTransactions = [];
            let skippedCount = 0;
    
            for await (const transaction of transactionContext.generateSaveAsync()) {
                if (transaction === null) {
                    skippedCount++;
    
                    continue;
                }
    
                newTransactions.push(transaction);
            }
            
            const newCount = newTransactions.length;

            response = skippedCount > 0
                ? `Added ${newCount} new transactions to database, skipped ${skippedCount}`
                : `Added ${newCount} new transactions to database`
        } catch (ex) {
            response = ex instanceof Error
                ? `${ex.message}\n\n${ex.stack}`
                : ex;
        }
                
        console.log(response);

        res.type('text/plain')
           .status(200)
           .end(response);
    });

    return router;
}
