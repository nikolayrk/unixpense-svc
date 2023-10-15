import { Request, Response } from "express";
import { injectables } from "../../core/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import ILogger from "../../core/contracts/ILogger";
import TransactionRepository from "../../core/repositories/transactionRepository";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";
import { TransactionExtensions } from "../../core/extensions/transactionExtensions";
import { TransactionTypeExtensions } from "../../core/extensions/transactionTypeExtensions";
import { EntryTypeExtensions } from "../../core/extensions/entryTypeExtensions";
import TransactionType from "../../core/enums/transactionType";
import EntryType from "../../core/enums/entryType";

const get = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    const parseEnumQuery = (query: unknown) => {
        if (query === undefined || query == '') {
            return [] as string[];
        }

        if (!Array.isArray(query)) {
            return [query].map(String);
        }
        
        return query.map(String);
    }

    try {
        const { fromDate, toDate, fromSum, toSum, types, entryTypes } = req.query;
        const fromDateParsed = String(fromDate).concat(' 00:00:00').toUTCDate();
        const toDateParsed = String(toDate).concat(' 23:59:59').toUTCDate();
        const fromSumParsed = fromSum === undefined ? null : Number(fromSum);
        const toSumParsed = toSum === undefined ? null : Number(toSum);
        const typesParsed = parseEnumQuery(types).map(TransactionTypeExtensions.toEnum);
        const entryTypesParsed = parseEnumQuery(entryTypes).map(EntryTypeExtensions.toEnum);

        if (isNaN(fromDateParsed.getTime()) || isNaN(toDateParsed.getTime())) {
            return ResponseExtensions.badRequest(res, `Invalid date value: ${fromDate} / ${toDate}`);
        }

        if (fromDateParsed.getTime() > toDateParsed.getTime()) {
            return ResponseExtensions.badRequest(res, `Invalid date range: ${fromDateParsed.toResponse()} - ${toDateParsed.toResponse()}`);
        }

        if (fromSumParsed !== null && (Number.isNaN(fromSumParsed) || fromSumParsed < 0)) {
            return ResponseExtensions.badRequest(res, `Invalid sum value: ${fromSum}`);
        }

        if (toSumParsed !== null && (Number.isNaN(toSumParsed) || toSumParsed < 0)) {
            return ResponseExtensions.badRequest(res, `Invalid sum value: ${toSum}`);
        }
        
        if (toSumParsed !== null && fromSumParsed !== null) {
            if (fromSumParsed > toSumParsed) {
                return ResponseExtensions.badRequest(res, `Invalid sum range: ${fromSumParsed} - ${toSumParsed}`);
            }
        }

        for(const type of typesParsed) {
            if (!Object.values(TransactionType).includes(type)) {
                return ResponseExtensions.badRequest(res, `Invalid types value: ${type}`);
            }
        }

        for(const entryType of entryTypesParsed) {
            if (!Object.values(EntryType).includes(entryType)) {
                return ResponseExtensions.badRequest(res, `Invalid entryTypes value: ${entryType}`);
            }
        }

        const transactions = await transactionRepository.getAsync(fromDateParsed, toDateParsed, typesParsed, entryTypesParsed, fromSumParsed, toSumParsed);
        
        const resolvedCount = transactions.length;

        const message = `Resolved ${resolvedCount} transaction${resolvedCount == 1 ? '' : 's'}`;
        
        logger.log(message, {
            from_date: fromDate,
            to_date: toDate,
            ...(fromSum !== undefined) && {
                from_sum: fromSum
            },
            ...(toSum !== undefined) && {
                to_sum: toSum
            },
            ...(typesParsed.length > 0) && {
                types: typesParsed.join()
            },
            ...(entryTypesParsed.length > 0) && {
                entry_types: entryTypesParsed.join()
            },
        });

        const result = transactions.map(TransactionExtensions.toResponse);

        return ResponseExtensions.ok(res, result);
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
}

const save = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    try {
        const transactionsRaw: Record<string, string | number | object>[] = req.body;
        const transactions = transactionsRaw.map(TransactionExtensions.toModel);

        const existingTransactionIds = await transactionRepository.getAllIdsAsync();
        const newTransactions = transactions.filter(t => !transactionExists(t.id, existingTransactionIds, logger));

        const created = await transactionRepository.bulkCreateAsync(newTransactions);
        const skipped = transactionsRaw.length - created;

        logger.log(`Saved ${created} transaction${created === 1 ? '' : 's'} to database${skipped > 0 ? `, skipped ${skipped}` : ''}`);
        
        return ResponseExtensions.added(res, created, 'transaction');
    } catch (ex) {
        const error = ex as Error;

        logger.error(error);

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const transactionExists = (transactionId: string, existingTransactionIds: string[], logger: ILogger) => {
    const exists = existingTransactionIds.find((id) => id === transactionId) !== undefined;

    if (exists) {
        logger.warn("Transaction already exists", { transactionId: transactionId });

        return true;
    }

    return false;
};

export { save, get }