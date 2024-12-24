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
import Constants from "@shared/constants";

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
        const {
            fromDate,
            toDate,
            since,
            count,
            fromSum,
            toSum,
            types,
            entryTypes,
            recipient,
            description
        } = req.query;

        const fromDateParsed = fromDate === undefined ? null : new Date(String(fromDate).concat(' 00:00:00Z'));
        const toDateParsed = toDate === undefined ? null : new Date(String(toDate).concat(' 12:00:00Z'));
        const sinceParsed = since === undefined ? new Date() : new Date(String(since));
        const countParsed = count === undefined ? Constants.defaultTransactionCount : Number(count);
        const fromSumParsed = fromSum === undefined ? null : Number(fromSum);
        const toSumParsed = toSum === undefined ? null : Number(toSum);
        const typesParsed = parseEnumQuery(types).map(TransactionTypeExtensions.toEnum);
        const entryTypesParsed = parseEnumQuery(entryTypes).map(EntryTypeExtensions.toEnum);
        const recipientParsed = recipient ? String(recipient) : null;
        const descriptionParsed = description ? String(description) : null;

        if (fromDateParsed !== null && isNaN(fromDateParsed.getTime())) {
            ResponseExtensions.badRequest(res, `Invalid fromDate value: ${fromDate}`);
        
            return;
        }

        if (toDateParsed !== null && isNaN(toDateParsed.getTime())) {
            ResponseExtensions.badRequest(res, `Invalid toDate value: ${toDate}`);
        
            return;
        }

        if (fromDateParsed !== null && toDateParsed !== null && fromDateParsed.getTime() > toDateParsed.getTime()) {
            ResponseExtensions.badRequest(res, `Invalid date range: ${fromDateParsed.toResponse()} - ${toDateParsed.toResponse()}`);
        
            return;
        }

        if (isNaN(sinceParsed.getTime())) {
            ResponseExtensions.badRequest(res, `Invalid since value: ${since}`);
        
            return;
        }

        if (isNaN(Number(countParsed))) {
            ResponseExtensions.badRequest(res, `Invalid count value: ${count}`);
        
            return;
        }

        if (fromSumParsed !== null && (Number.isNaN(fromSumParsed) || fromSumParsed < 0)) {
            ResponseExtensions.badRequest(res, `Invalid sum value: ${fromSum}`);
        
            return;
        }

        if (toSumParsed !== null && (Number.isNaN(toSumParsed) || toSumParsed < 0)) {
            ResponseExtensions.badRequest(res, `Invalid sum value: ${toSum}`);
        
            return;
        }
        
        if (toSumParsed !== null && fromSumParsed !== null) {
            if (fromSumParsed > toSumParsed) {
                ResponseExtensions.badRequest(res, `Invalid sum range: ${fromSumParsed} - ${toSumParsed}`);
        
                return;
            }
        }

        for(const type of typesParsed) {
            if (!Object.values(TransactionType).includes(type)) {
                ResponseExtensions.badRequest(res, `Invalid types value: ${type}`);
        
                return;
            }
        }

        for(const entryType of entryTypesParsed) {
            if (!Object.values(EntryType).includes(entryType)) {
                ResponseExtensions.badRequest(res, `Invalid entryTypes value: ${entryType}`);
        
                return;
            }
        }

        const transactions = await transactionRepository.filterAsync(
            fromDateParsed,
            toDateParsed,
            sinceParsed,
            countParsed,
            typesParsed,
            entryTypesParsed,
            fromSumParsed,
            toSumParsed,
            recipientParsed,
            descriptionParsed);
        
        const resolvedCount = transactions.length;

        const message = `Resolved ${resolvedCount} transaction${resolvedCount == 1 ? '' : 's'}`;
        
        logger.log(message, {
            since: sinceParsed.toISOString(),
            count: countParsed,
            ...(fromDateParsed !== null) && {
                from_date: fromDate
            },
            ...(toDateParsed !== null) && {
                to_date: toDate
            },
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
            ...(recipientParsed !== null) && {
                recipient: recipientParsed
            },
            ...(descriptionParsed !== null) && {
                description: description
            }
        });

        const result = transactions.map(TransactionExtensions.toResponse);

        ResponseExtensions.ok(res, result);
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        ResponseExtensions.internalError(res, error.message ?? ex);
    }
}

const save = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    try {
        const transactionsRaw: Record<string, string | number | object>[] = Array.isArray(req.body) ? req.body : [];
        const transactions = transactionsRaw.map(TransactionExtensions.toModel);

        const existingTransactionIds = await transactionRepository.getAllIdsAsync();
        const newTransactions = transactions.filter(t => !transactionExists(t.id, existingTransactionIds, logger));

        const created = await transactionRepository.bulkCreateAsync(newTransactions);
        const skipped = transactionsRaw.length - created;

        logger.log(`Saved ${created} transaction${created === 1 ? '' : 's'} to database${skipped > 0 ? `, skipped ${skipped}` : ''}`);
        
        ResponseExtensions.added(res, created, 'transaction');
    } catch (ex) {
        const error = ex as Error;

        logger.error(error);

        ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const update = async (req: Request, res: Response) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    const transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    try {
        const transactionsRaw: Record<string, string | number | object>[] = Array.isArray(req.body) ? req.body : [];
        const transactions = transactionsRaw.map(TransactionExtensions.toModel);

        const updated = await transactionRepository.bulkUpdateAsync(transactions);
        const skipped = transactions.length - updated;

        logger.log(`Updated ${updated} transaction${updated === 1 ? '' : 's'}${skipped > 0 ? `, skipped ${skipped}` : ''}`);
        
        ResponseExtensions.noContent(res);
    } catch (ex) {
        const error = ex as Error;

        logger.error(error);

        ResponseExtensions.internalError(res, error.message ?? ex);
    }
}

const transactionExists = (transactionId: string, existingTransactionIds: string[], logger: ILogger) => {
    const exists = existingTransactionIds.find((id) => id === transactionId) !== undefined;

    if (exists) {
        logger.warn("Transaction already exists", { transactionId: transactionId });

        return true;
    }

    return false;
};

export { save, get, update }
