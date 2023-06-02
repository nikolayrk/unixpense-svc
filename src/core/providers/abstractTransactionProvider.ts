import { injectable } from "inversify";
import { injectables } from "../../core/types/injectables";
import ILogger from "../../core/contracts/ILogger";
import ITransactionDataProvider from "../../core/contracts/ITransactionDataProvider";
import PaymentDetailsContext from "../contexts/paymentDetailsContext";
import TransactionFactory from "../factories/transactionFactory";
import { DependencyInjector } from "../../dependencyInjector";
import ITransactionSourceProvider from "../../core/contracts/ITransactionSourceProvider";
import ITransactionProvider from "../../core/contracts/ITransactionProvider";

@injectable()
export default abstract class AbstractTransactionProvider implements ITransactionProvider {
    private readonly logger;
    private readonly transactionDataProvider;
    private readonly paymentDetailsContext;
    private readonly transactionFactory;

    protected readonly transactionSourceProvider!: ITransactionSourceProvider;

    public constructor() {
        this.logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        this.transactionDataProvider = DependencyInjector.Singleton.resolve<ITransactionDataProvider>(injectables.ITransactionDataProvider);
        this.paymentDetailsContext = DependencyInjector.Singleton.resolve<PaymentDetailsContext>(injectables.PaymentDetailsContext);
        this.transactionFactory = DependencyInjector.Singleton.resolve<TransactionFactory>(injectables.TransactionFactory);
    }

    public async * generateAsync(transactionIdsQuery?: string) {
        this.logger.log(`Generating transaction IDs...`, transactionIdsQuery !== undefined ? { query: transactionIdsQuery } : {});
        
        for await (const transactionId of this.generateTransactionIdsAsync(transactionIdsQuery)) {
            yield transactionId;
        }

        return [];
    }

    public async resolveTransactionOrNullAsync(transactionId: string) {
        this.logger.log(`Resolving transaction...`, { transactionId: transactionId });

        try {
            const transactionSource = await this.transactionSourceProvider.getAsync(transactionId);

            const transactionData = this.transactionDataProvider.get(transactionSource);

            const paymentDetails = this.paymentDetailsContext.resolve(
                transactionData.reference,
                transactionData.transactionType,
                transactionData.paymentDetailsRaw,
                transactionData.additionalDetailsRaw);

            const transaction = this.transactionFactory.create(transactionId, transactionData, paymentDetails);

            return transaction;
        } catch(ex) {
            const error = ex as Error;

            this.logger.error(error, { transactionId: transactionId });

            return null;
        }
    }

    private generateTransactionIdsAsync(transactionIdsQuery?: string) {
        return transactionIdsQuery !== undefined
            ? this.generateTransactionIdsFromQueryAsync(transactionIdsQuery)
            : this.transactionSourceProvider.generateTransactionIdsAsync();
    }

    private async * generateTransactionIdsFromQueryAsync(transactionIdsQuery: string) {
        const transactionIds = transactionIdsQuery
            .split(',')
            .filter(id => id.trim() !== '');

        for (const i in transactionIds) {
            const transactionId = transactionIds[i];

            yield transactionId;
        }

        return [];
    }
}