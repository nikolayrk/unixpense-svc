import { Request, Response } from "express";
import GmailTransactionProvider from "../../services/gmail/providers/gmailTransactionProvider";
import { injectables } from "../../shared/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2Identifiers from "../../services/gmail/models/googleOAuth2Identifiers";
import ILogger from "../../services/contracts/ILogger";
import TransactionRepository from "../../database/repositories/transactionRepository";
import ITransactionProvider from "../../services/contracts/ITransactionProvider";
import { ResponseExtensions } from "../../shared/extensions/responseExtensions";

const getLast = async (req: Request, res: Response) => {
    const last = req.params.last;

    if (last === "") {
        return ResponseExtensions.badRequest(res, "No last amount provided");
    }
    
    const lastValue = Number(last);

    if (Number.isNaN(last) || lastValue < 1) {
        return ResponseExtensions.badRequest(res, "Invalid last amount provided");
    }

    const skipDepth = req.query.skip_depth;
    
    const skipDepthValue = Number(skipDepth);

    if (Number.isNaN(skipDepth) || skipDepthValue < 1) {
        return ResponseExtensions.badRequest(res, "Invalid skip depth provided");
    }

    const skipSaved = req.query.skip_saved === 'true';

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const transactionIds = await resolveTransactionIdsAsync({
            identifiers,
            save: false,
            last: lastValue,
            skipDepth: skipDepthValue
        }, skipSaved);
        
        return ResponseExtensions.ok(res, transactionIds);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const resolve = async (req: Request, res: Response) => {
    const ids: [] = req.body;

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const transactions = await resolveTransactionsAsync({
            identifiers,
            save: false,
            ids: ids.join(',')
        });
        
        return ResponseExtensions.ok(res, transactions);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const save = async (req: Request, res: Response) => {
    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const ids: [] = req.body;

        const created = await saveTransactionsAsync({
            identifiers,
            save: true,
            ids: ids.join(',')
        });
        
        return ResponseExtensions.added(res, created, 'transaction');
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

type Options = {
    identifiers: GoogleOAuth2Identifiers,
    save: boolean,
    ids?: string,
    last?: number,
    skipDepth?: number};

const resolveTransactionIdsAsync = async (options: Options, skipSaved?: boolean) => {
    if (skipSaved === true) {
        const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);
    
        const existingTransactionIds = await transactionRepository.getAllIdsAsync();
    
        const transactionIds = await generateTransactionsAsync(options, async (_, __, transactionId) => {
            const exists = existingTransactionIds.find((id) => id === transactionId) !== undefined;
    
            if (exists) {
                return null;
            }
    
            return transactionId;
        });

        return transactionIds;
    }

    const transactionIds = await generateTransactionsAsync(options, async (_, __, transactionId) => transactionId);

    return transactionIds;
}

const resolveTransactionsAsync = async(options: Options) => {
    const transactions = await generateTransactionsAsync(options, async (_, gmailTransactionProvider, transactionId) => await gmailTransactionProvider.resolveTransactionOrNullAsync(transactionId));

    return transactions;
}

const saveTransactionsAsync = async (options: Options) => {
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    const existingTransactionIds = await transactionRepository.getAllIdsAsync();
    
    const transactions = await generateTransactionsAsync(options, async (logger, gmailTransactionProvider, transactionId) => {
            const exists = existingTransactionIds.find((id) => id === transactionId) !== undefined;

            if (exists) {
                logger.warn("Transaction already exists", { transactionId: transactionId });

                return null;
            }

            const transaction = await gmailTransactionProvider.resolveTransactionOrNullAsync(transactionId);
            
            return transaction;
        });

    const created = await transactionRepository.tryBulkCreate(transactions);

    return created;
}

const generateTransactionsAsync = async <T>(
    options: Options,
    transactionHandlerAsync: (
        logger: ILogger,
        transactionProvider: ITransactionProvider,
        transactionId: string) => Promise<T | null>) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const gmailTransactionProvider = await DependencyInjector.Singleton
        .generateServiceAsync<GmailTransactionProvider>(injectables.GmailTransactionProviderGenerator, options.identifiers);
    
    try {
        const results: T[] = [];
        let skippedCount = 0;
        let consecutiveSkippedCount = 0;

        for await (const transactionIdOrNull of gmailTransactionProvider.generateAsync(options.ids)) {
            if (options.last !== undefined && results.length + skippedCount >= options.last) {
                break;
            }

            if (options.skipDepth !== undefined && consecutiveSkippedCount >= options.skipDepth) {
                break;
            }

            if (transactionIdOrNull === null) {
                skippedCount++;
                consecutiveSkippedCount++;

                continue;
            }

            const result = await transactionHandlerAsync(logger, gmailTransactionProvider, transactionIdOrNull);

            if (result === null) {
                skippedCount++;
                consecutiveSkippedCount++;

                continue;
            }
            
            results.push(result);
            consecutiveSkippedCount = 0;
        }

        const processedTransactionResultsCount = results.length;

        logResult(logger, processedTransactionResultsCount, skippedCount, options);

        return results;
    } catch(ex) {
        const error = ex as Error;

        logError(logger, error, options);

        throw ex;
    }
};

const logResult = (logger: ILogger, resolvedCount: number, skippedCount: number, options: Options) => {
    const response = `${options.save === true
        ? `Resolved & saved`
        : `Resolved`}${!options.last !== undefined
            ? ` ${resolvedCount}`
            : ` ${resolvedCount} out of the last ${options.last}`
                } transaction${!options.last !== undefined && resolvedCount == 1 ? '' : 's'}${skippedCount > 0
                        ? `, skipped ${skippedCount}${options.skipDepth !== undefined
                            ? ` with a skip depth of ${options.skipDepth}`
                            : ''}`
                        : ``}`

    const { identifiers, save, ...labels } = options;

    logger.log(response, { ...labels });
};

const logError = (logger: ILogger, error: Error, options: Options) => {
    const { identifiers, save, ...labels } = options;

    logger.error(error, { ...labels });
}

export { getLast, resolve, save }