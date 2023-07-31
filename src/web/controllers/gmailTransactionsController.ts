import { Request, Response } from "express";
import { injectables } from "../../core/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2Identifiers from "../../googleOAuth2/models/googleOAuth2Identifiers";
import ILogger from "../../core/contracts/ILogger";
import TransactionRepository from "../../core/repositories/transactionRepository";
import ITransactionProvider from "../../core/contracts/ITransactionProvider";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";
import { TransactionExtensions } from "../../core/extensions/transactionExtensions";

type Options = {
    save: boolean,
    ids?: string,
    last?: number,
    skipDepth?: number
};

const getLast = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    const last = req.params.last;
    
    const lastValue = Number(last);

    if (Number.isNaN(lastValue) || lastValue < 1) {
        return ResponseExtensions.badRequest(res, "Invalid last amount provided");
    }

    const skipDepth = req.query.skip_depth;
    
    const skipDepthValue = Number(skipDepth);

    if (skipDepth !== undefined && (Number.isNaN(skipDepthValue) || skipDepthValue < 1)) {
        return ResponseExtensions.badRequest(res, "Invalid skip depth provided");
    }

    const skipSaved = req.query.skip_saved === 'true';

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const transactionIds = await resolveTransactionIdsAsync(identifiers, {
            save: false,
            last: lastValue,
            skipDepth: skipDepthValue
        }, skipSaved, logger);
        
        return ResponseExtensions.ok(res, transactionIds);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const resolve = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    const ids: [] = req.body;

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const transactions = await resolveTransactionsAsync(identifiers, {
            save: false,
            ids: ids.join(',')
        }, logger);

        const result = transactions
            .map(t => TransactionExtensions.MapTransactionResponse(t));
        
        return ResponseExtensions.ok(res, result);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const save = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    const identifiers = res.locals.googleOAuth2Identifiers as GoogleOAuth2Identifiers;

    try {
        const ids: [] = req.body;

        const created = await saveTransactionsAsync(identifiers, {
            save: true,
            ids: ids.join(',')
        }, logger);
        
        return ResponseExtensions.added(res, created, 'transaction');
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const resolveTransactionIdsAsync = async (
    identifiers: GoogleOAuth2Identifiers,
    options: Options,
    skipSaved: boolean,
    logger: ILogger) => {
    if (skipSaved === true) {
        const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);
    
        const existingTransactionIds = await transactionRepository.getAllIdsAsync();
    
        const transactionIds = await generateTransactionsAsync(identifiers, options, logger, async (_, transactionId) =>
            transactionExists(transactionId, existingTransactionIds)
                ? null
                : transactionId);

        return transactionIds;
    }

    const transactionIds = await generateTransactionsAsync(identifiers, options, logger, async (_, transactionId) => transactionId);

    return transactionIds;
}

const resolveTransactionsAsync = (
    identifiers: GoogleOAuth2Identifiers,
    options: Options,
    logger: ILogger) =>
    generateTransactionsAsync(identifiers, options, logger, (gmailTransactionProvider, transactionId) =>
        gmailTransactionProvider.resolveTransactionAsync(transactionId));

const saveTransactionsAsync = async (
    identifiers: GoogleOAuth2Identifiers,
    options: Options,
    logger: ILogger) => {
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    const existingTransactionIds = await transactionRepository.getAllIdsAsync();
    
    const transactions = await generateTransactionsAsync(identifiers, options, logger, async (gmailTransactionProvider, transactionId) =>
        transactionExists(transactionId, existingTransactionIds, logger)
            ? null
            : gmailTransactionProvider.resolveTransactionAsync(transactionId));

    const created = await transactionRepository.bulkCreateAsync(transactions);

    return created;
}

const transactionExists = (transactionId: string, existingTransactionIds: string[], logger?: ILogger) => {
    const exists = existingTransactionIds.find((id) => id === transactionId) !== undefined;

    if (exists) {
        logger?.warn("Transaction already exists", { transactionId: transactionId });

        return true;
    }

    return false;
};

const generateTransactionsAsync = async <T>(
    identifiers: GoogleOAuth2Identifiers,
    options: Options,
    logger: ILogger,
    transactionHandlerAsync: (transactionProvider: ITransactionProvider, transactionId: string) => Promise<T | null>) => {
    try {
        const results: T[] = [];
        let skippedCount = 0;
        let consecutiveSkippedCount = 0;

        if (options.ids?.length === 0) {
            return results;
        }
        
        const gmailTransactionProvider = await DependencyInjector.Singleton
            .generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, identifiers);

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

            const result = await transactionHandlerAsync(gmailTransactionProvider, transactionIdOrNull);

            if (result === null) {
                skippedCount++;
                consecutiveSkippedCount++;

                continue;
            }
            
            results.push(result);
            consecutiveSkippedCount = 0;
        }

        const resolvedCount = results.length;

        logResult(options, resolvedCount, skippedCount, logger);

        return results;
    } catch(ex) {
        const error = ex as Error;

        logError(options, error, logger);

        throw ex;
    }
};

const logResult = (options: Options, resolvedCount: number, skippedCount: number, logger: ILogger) => {
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

    const { save, skipDepth, ...labels } = options;

    logger.log(response, { ...labels, ...(!Number.isNaN(skipDepth)) && { skipDepth } });
};

const logError = (options: Options, error: Error, logger: ILogger) => {
    const { save, skipDepth, ...labels } = options;

    logger.error(error, { ...labels, ...(!Number.isNaN(skipDepth)) && { skipDepth } });
}

export { getLast, resolve, save }