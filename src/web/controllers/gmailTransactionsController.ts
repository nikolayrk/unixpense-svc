import { Request, Response } from "express";
import { injectables } from "../../core/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2Identifiers from "../../googleOAuth2/types/googleOAuth2Identifiers";
import ILogger from "../../core/contracts/ILogger";
import TransactionRepository from "../../core/repositories/transactionRepository";
import ITransactionProvider from "../../core/contracts/ITransactionProvider";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";
import { TransactionExtensions } from "../../core/extensions/transactionExtensions";
import Transaction from "../../core/types/transaction";
import PaymentDetails from "../../core/types/paymentDetails";

const getLast = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    const lastParam = req.params.last;
    
    const last = Number(lastParam);

    if (Number.isNaN(last) || last < 1) {
        return ResponseExtensions.badRequest(res, `Invalid last amount provided: ${lastParam}`);
    }

    const skipDepthQuery = req.query.skip_depth;
    
    const skipDepth = Number(skipDepthQuery);

    if (skipDepthQuery !== undefined && (Number.isNaN(skipDepth) || skipDepth < 1)) {
        return ResponseExtensions.badRequest(res, `Invalid skip depth provided: ${skipDepthQuery}`);
    }

    const skipSaved = req.query.skip_saved === 'true';

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;
    const gmailTransactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, identifiers);
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    try {
        const existingTransactionIds = skipSaved
            ? await transactionRepository.getAllIdsAsync()
            : []; // Only load existing IDs if needed

        const transactionIds: string[] = [];
        let skippedCount = 0;
        let consecutiveSkippedCount = 0;

        for await (const transactionId of gmailTransactionProvider.generateAsync()) {
            if (lastParam !== undefined && transactionIds.length + skippedCount >= last) {
                break;
            }

            if (skipDepthQuery !== undefined && consecutiveSkippedCount >= skipDepth) {
                break;
            }

            const transactionExists = existingTransactionIds.find((id) => id === transactionId) !== undefined;

            if (skipSaved && transactionExists) {
                skippedCount++;
                consecutiveSkippedCount++;

                continue;
            }
            
            transactionIds.push(transactionId);

            consecutiveSkippedCount = 0;
        }

        const resolvedCount = transactionIds.length;
        
        const message = `Resolved ${resolvedCount} out of the last ${last} transaction ids${
            skippedCount > 0
                ? `, skipped ${skippedCount}${skipDepthQuery !== undefined
                    ? ` with a skip depth of ${skipDepth}`
                    : ''}`
                : ``}`

        logger.log(message, {
            last: last,
            ...(skipDepthQuery !== undefined && !Number.isNaN(skipDepth)) && { skip_depth: skipDepth },
            ...(skipSaved !== undefined) && { skip_saved: skipSaved },
            access_token: identifiers.accessToken
        });

        return ResponseExtensions.ok(res, transactionIds);
    } catch (ex) {
        const error = ex as Error;

        logger.error(error, {
            last: last,
            ...(skipDepthQuery !== undefined && !Number.isNaN(skipDepth)) && { skip_depth: skipDepth },
            ...(skipSaved !== undefined) && { skip_saved: skipSaved },
            access_token: identifiers.accessToken
        })

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const resolve = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    const ids: string[] = req.body;
    
    if (!Array.isArray(ids)) {
        return ResponseExtensions.badRequest(res, `Bad ids parameter: ${ids}`);
    }

    const aggregatedIds = ids.join(',');

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;
    const gmailTransactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, identifiers);

    try {
        let transactions: Transaction<PaymentDetails>[] = [];

        for (const id of ids) {
            const transaction = await gmailTransactionProvider.resolveTransactionAsync(id);

            transactions.push(transaction);
        }

        const resolvedCount = transactions.length;

        const message = `Resolved ${resolvedCount} transaction${resolvedCount == 1 ? '' : 's'}`;

        logger.log(message, { transaction_ids: aggregatedIds, access_token: identifiers.accessToken });

        const result = transactions.map(TransactionExtensions.toResponse);
        
        return ResponseExtensions.ok(res, result);
    } catch (ex) {
        const error = ex as Error;

        logger.error(error, { transactionIds: aggregatedIds, access_token: identifiers.accessToken });

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

export { getLast, resolve }