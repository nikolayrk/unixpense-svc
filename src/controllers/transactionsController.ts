import { Request, Response } from "express";
import TransactionContext from "../services/contexts/transactionContext";
import { injectables } from "../shared/types/injectables";
import ILogger from "../services/contracts/ILogger";
import { DependencyInjector } from "../dependencyInjector";

const get = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionContext = DependencyInjector.Singleton.resolve<TransactionContext>(injectables.TransactionContext);

    const { last, ids, save } = req.query;
    
    const hasLast = last !== undefined && !Number.isNaN(last);

    const lastValue = Number(last);
    const idsValue = ids === undefined ? undefined : String(ids);
    const saveValue = /^true$/i.test(save?.toString() ?? '');

    if (last !== undefined && (hasLast == false || lastValue < 1)) {
        res
            .status(400)
            .end(`Invalid value for 'last' parameter`);

        return;
    }

    const processTransactionsAsync = async () => {
        const transactionGenerator = saveValue
            ? transactionContext.generateSaveAsync(idsValue)
            : transactionContext.generateAsync(idsValue);

        const processedTransactions = [];
        let skippedCount = 0;

        for await (const transactionOrNull of transactionGenerator) {
            if (transactionOrNull === null) {
                skippedCount++;
            } else {
                processedTransactions.push(transactionOrNull);
            }

            if (hasLast && processedTransactions.length + skippedCount >= lastValue) {
                break;
            }
        }

        return { processedTransactions, skippedCount };
    };

    try {
        const { processedTransactions, skippedCount } = await processTransactionsAsync();

        const processedTransactionsCount = processedTransactions.length;

        const response = `${saveValue
            ? `Processed & saved`
            : `Processed`}${!hasLast
                ? ` ${processedTransactionsCount}`
                : ` ${processedTransactionsCount} out of the last ${lastValue}`
                    } transaction${!hasLast && processedTransactionsCount == 1 ? '' : 's'}${idsValue === undefined ? ''
                        : ` from the query '${idsValue}'`
                            }${skippedCount > 0
                                ? `, skipped ${skippedCount}`
                                : ``}`

        logger.log(response, { ...req.query });
        
        if (saveValue === false) {
            // Dump if we didn't explicitly request a save
            res
                .json(processedTransactions)
                .end();
        } else {
            // Inform of amount processed & skipped, if a save was requested
            res
                .type('text/plain')
                .status(200)
                .end(response);
        }
    } catch (ex) {
        const error = ex as Error;

        logger.error(error, { ...req.query });

        res
            .status(500)
            .end(error.message ?? ex);
    }
}

export { get }
