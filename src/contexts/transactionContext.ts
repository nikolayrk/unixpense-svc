import { inject, injectable } from "inversify";
import ITransactionDataProvider from "../contracts/ITransactionDataProvider";
import ITransactionSourceProvider from "../contracts/ITransactionSourceProvider";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import TransactionFactory from "../factories/transactionFactory";
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import TransactionRepository from "../repositories/transactionRepository";
import { injectables } from "../types/injectables";
import PaymentDetailsContext from "./paymentDetailsContext";
import ILogger from "../contracts/ILogger";
import RepositoryError from "../errors/repositoryError";

@injectable()
export default class TransactionContext {
    private readonly logger;
    private readonly transactionSourceProvider;
    private readonly transactionDataProvider;
    private readonly paymentDetailsContext;
    private readonly transactionFactory;
    private readonly transactionRepository;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

        @inject(injectables.ITransactionSourceProvider)
        transactionSourceProvider: ITransactionSourceProvider,

        @inject(injectables.ITransactionDataProvider)
        transactionDataProvider: ITransactionDataProvider,

        @inject(injectables.PaymentDetailsContext)
        paymentDetailsContext: PaymentDetailsContext,
        
        @inject(injectables.TransactionFactory)
        transactionFactory: TransactionFactory,

        @inject(injectables.TransactionRepository)
        transactionRepository: TransactionRepository,
    ) {
        this.logger = logger;
        this.transactionSourceProvider = transactionSourceProvider;
        this.transactionDataProvider = transactionDataProvider;
        this.paymentDetailsContext = paymentDetailsContext;
        this.transactionFactory = transactionFactory;
        this.transactionRepository = transactionRepository;
    }

    public async * generateAsync(transactionIdsQuery?: string) {
        this.logger.log(`Generating transaction IDs...`, transactionIdsQuery !== undefined ? { query: transactionIdsQuery } : {});
        
        for await (const transactionId of this.generateTransactionIdsAsync(transactionIdsQuery)) {
            const transaction = await this.getTransactionOrNullAsync(transactionId);

            yield transaction;
        }

        return [];
    }

    public async * generateSaveAsync(transactionIdsQuery?: string) {
        this.logger.log(`Generating new transaction IDs...`, transactionIdsQuery ? { query: transactionIdsQuery } : {});
        
        for await (const transactionId of this.generateTransactionIdsAsync()) {
            if (await this.transactionExistsAsync(transactionId)) {
                this.logger.warn(`Transaction already exists`, { transactionId: transactionId });

                yield null;
                
                continue;
            }

            const transaction = await this.getTransactionOrNullAsync(transactionId);

            if (transaction === null) {
                yield null;

                continue;
            }

            const result = await this.addTransactionAsync(transaction);

            yield result
                ? transaction
                : null;
        }

        return [];
    }

    private generateTransactionIdsAsync(transactionIdsQuery?: string) {
        return transactionIdsQuery !== undefined
            ? this.generateTransactionIdsFromQueryAsync(transactionIdsQuery)
            : this.transactionSourceProvider.generateTransactionIdsAsync();
    }

    private async * generateTransactionIdsFromQueryAsync(transactionIdsQuery: string) {
        const transactionIds = transactionIdsQuery.split(',');

        for (const i in transactionIds) {
            const transactionId = transactionIds[i];

            yield transactionId;
        }

        return [];
    }

    private async getTransactionOrNullAsync(transactionId: string) {
        this.logger.log(`Processing transaction...`, { transactionId: transactionId });

        try {
            const transactionSource = await this.transactionSourceProvider.getAsync(transactionId);

            const transactionData = this.transactionDataProvider.get(transactionSource);

            const paymentDetails = this.paymentDetailsContext.resolve(
                transactionData.reference,
                transactionData.transactionType,
                transactionData.paymentDetailsRaw,
                transactionData.additionalDetailsRaw);

            const transaction = this.transactionFactory.create(transactionId, transactionData, paymentDetails);
            
            this.logger.log(`Successfully processed transaction`, { transactionId: transactionId });

            return transaction;
        } catch(ex) {
            const error = ex as Error;

            this.logger.error(error, { transactionId: transactionId });

            return null;
        }
    }

    private async transactionExistsAsync(transactionId: string) { 
        return this.transactionRepository.existsAsync(transactionId);
    }

    private async addTransactionAsync(transaction: Transaction<PaymentDetails>) {
        const transactionTypeString = TransactionTypeExtensions.ToString(transaction.type);

        this.logger.log(`Adding transaction to database...`, {
            transactionId: transaction.id,
            transactionReference: transaction.reference,
            transactionType: transactionTypeString
        });

        try {
            await this.transactionRepository.tryCreateAsync(transaction);
        } catch(ex) {
            if (ex instanceof RepositoryError) {
                this.logger.error(ex, {
                    transactionId: transaction.id,
                    transactionReference: transaction.reference,
                    transactionType: transactionTypeString
                });

                return false;
            }

            throw ex;
        }
        
        this.logger.log(`Successfully added transaction to database`, {
            transactionId: transaction.id,
            transactionReference: transaction.reference,
            transactionType: transactionTypeString
        });

        return true;
    }
}