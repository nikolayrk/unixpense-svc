import express, { Request, Response } from "express";
import TransactionContext from "../contexts/transactionContext";
import { DependencyInjector } from "../dependencyInjector";
import { injectables } from "../types/injectables";
import ILogger from "../contracts/ILogger";

export default function transactionsRouter() {
    const router = express.Router();

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionContext = DependencyInjector.Singleton.resolve<TransactionContext>(injectables.TransactionContext);

    router.use('/transactions', async (req: Request, res: Response) => {
        const ids = req.query.ids?.toString();
        const last = Number(req.query.last?.toString());
        const hasLast = !Number.isNaN(last);
        const refresh = /^true$/i.test(req.query.refresh?.toString() ?? '');
        const dump = /^true$/i.test(req.query.dump?.toString() ?? '');

        const response = await (async () => {
            try {
                const transactionGenerator = refresh
                    ? transactionContext.generateSaveAsync(ids)
                    : transactionContext.generateAsync(ids);

                const transactions = [];
                let skippedCount = 0;

                for await (const transactionOrNull of transactionGenerator) {
                    if (transactionOrNull === null) {
                        skippedCount++;
        
                        continue;
                    }

                    transactions.push(transactionOrNull);

                    if (hasLast && transactions.length >= last) {
                        break;
                    }
                }
                
                const count = transactions.length;
                const transactionsJson = JSON.stringify(transactions, null, 2);

                const response = `${refresh
                    ? `Processed & persisted`
                    : `Processed`}${!hasLast
                        ? ` ${count}`
                        : ` ${count} out of the last ${last}`
                            } transactions${ids === undefined ? ''
                                : ` from the query '${ids}'`
                                    }${skippedCount > 0
                                        ? `, skipped ${skippedCount}`
                                        : ``}`;

                logger.log(response, req.query);

                return `${response}${!dump ? '' : `:\n\n${transactionsJson}` }`;
            } catch (ex) {
                const error = ex as Error;

                logger.error(error, req.query);
                
                return `${error.message}\n\n${error.stack}`;
            }
        })();

        res.type('text/plain')
           .status(200)
           .end(response);
    });

    return router;
}
