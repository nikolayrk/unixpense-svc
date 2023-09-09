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

    protected readonly transactionSourceProvider!: ITransactionSourceProvider;

    public constructor() {
        this.logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        this.transactionDataProvider = DependencyInjector.Singleton.resolve<ITransactionDataProvider>(injectables.ITransactionDataProvider);
        this.paymentDetailsContext = DependencyInjector.Singleton.resolve<PaymentDetailsContext>(injectables.PaymentDetailsContext);
    }

    public async * generateAsync() {
        this.logger.log(`Generating transaction IDs...`);
        
        for await (const transactionId of this.transactionSourceProvider.generateTransactionIdsAsync()) {
            yield transactionId;
        }

        return [];
    }

    public async resolveTransactionAsync(transactionId: string) {
        this.logger.log(`Resolving transaction...`, { transactionId: transactionId });

        const transactionSource = await this.transactionSourceProvider.getAsync(transactionId);

        const transactionData = this.transactionDataProvider.get(transactionSource);

        const paymentDetails = this.paymentDetailsContext.resolve(
            transactionData.reference,
            transactionData.transactionType,
            transactionData.paymentDetailsRaw,
            transactionData.additionalDetailsRaw);

        const transaction = TransactionFactory.create(transactionId, transactionData, paymentDetails);

        return transaction;
    }
}