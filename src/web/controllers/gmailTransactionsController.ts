import { Request, Response } from "express";
import GmailTransactionProvider from "../../services/gmail/providers/gmailTransactionProvider";
import { injectables } from "../../shared/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2Identifiers from "../../services/gmail/models/googleOAuth2Identifiers";
import ILogger from "../../services/contracts/ILogger";

const get = async (req: Request, res: Response) => {
    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const gmailTransactionProvider = await DependencyInjector.Singleton.generateServiceAsync<GmailTransactionProvider>(injectables.GmailTransactionProviderGenerator, identifiers);

    const { last, ids, save } = req.query;
    
    const hasLast = last !== undefined && !Number.isNaN(last);

    const lastValue = Number(last);
    const idsValue = ids === undefined ? undefined : String(ids);
    const saveValue = /^true$/i.test(save?.toString() ?? '');

    if (hasLast == true && lastValue < 1) {
        res
            .status(400)
            .json({ error: "Invalid value for 'last' parameter" })
            .end();

        return;
    }

    const processTransactionsAsync = async () => {
        const transactionGenerator = saveValue
            ? gmailTransactionProvider.generateSaveAsync(idsValue)
            : gmailTransactionProvider.generateAsync(idsValue);

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
                .status(200)
                .json(processedTransactions)
                .end();
        } else {
            // Inform of amount processed & skipped, if a save was requested
            res
                .status(200)
                .json({ message: response })
                .end();
        }
    } catch (ex) {
        const error = ex as Error;

        logger.error(error, { ...req.query });

        res
            .status(500)
            .json({ error: error.message ?? ex })
            .end();
    }
}

export { get }
