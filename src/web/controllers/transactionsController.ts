import { Request, Response } from "express";
import { injectables } from "../../core/types/injectables";
import { DependencyInjector } from "../../dependencyInjector";
import ILogger from "../../core/contracts/ILogger";
import TransactionRepository from "../../core/repositories/transactionRepository";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";
import { TransactionExtensions } from "../../core/extensions/transactionExtensions";

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

export { save }