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
import Constants from "../../constants";

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

        const fromDateParsed = fromDate === undefined ? null : String(fromDate).concat(' 00:00:00').toUTCDate();
        const toDateParsed = toDate === undefined ? null : String(toDate).concat(' 23:59:59').toUTCDate();
        const sinceParsed = since === undefined ? new Date() : new Date(String(since));
        const countParsed = count === undefined ? Constants.defaultTransactionCount : Number(count);
        const fromSumParsed = fromSum === undefined ? null : Number(fromSum);
        const toSumParsed = toSum === undefined ? null : Number(toSum);
        const typesParsed = parseEnumQuery(types).map(TransactionTypeExtensions.toEnum);
        const entryTypesParsed = parseEnumQuery(entryTypes).map(EntryTypeExtensions.toEnum);
        const recipientParsed = recipient ? String(recipient) : null;
        const descriptionParsed = description ? String(description) : null;

        if (fromDateParsed !== null && isNaN(fromDateParsed.getTime())) {
            return ResponseExtensions.badRequest(res, `Invalid fromDate value: ${fromDate}`);
        }

        if (toDateParsed !== null && isNaN(toDateParsed.getTime())) {
            return ResponseExtensions.badRequest(res, `Invalid toDate value: ${toDate}`);
        }

        if (fromDateParsed !== null && toDateParsed !== null && fromDateParsed.getTime() > toDateParsed.getTime()) {
            return ResponseExtensions.badRequest(res, `Invalid date range: ${fromDateParsed.toResponse()} - ${toDateParsed.toResponse()}`);
        }

        if (isNaN(sinceParsed.getTime())) {
            return ResponseExtensions.badRequest(res, `Invalid since value: ${since}`);
        }

        if (isNaN(Number(countParsed))) {
            return ResponseExtensions.badRequest(res, `Invalid count value: ${count}`);
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