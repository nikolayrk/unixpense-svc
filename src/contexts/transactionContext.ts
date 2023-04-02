import { inject, injectable } from "inversify";
import ITransactionRepository from "../contracts/ITransactionRepository";
import ITransactionSourceProvider from "../contracts/ITransactionSourceProvider";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import TransactionFactory from "../factories/transactionFactory";
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import { injectables } from "../types/injectables";
import PaymentDetailsContext from "./paymentDetailsContext";

@injectable()
export default class TransactionContext {
    private readonly transactionSourceProvider;
    private readonly paymentDetailsContext;
    private readonly transactionFactory;
    private readonly transactionRepository;

    public constructor(
        @inject(injectables.ITransactionSourceProvider)
        transactionSourceProvider: ITransactionSourceProvider,

        @inject(injectables.PaymentDetailsContext)
        paymentDetailsContext: PaymentDetailsContext,
        
        @inject(injectables.TransactionFactory)
        transactionFactory: TransactionFactory,

        @inject(injectables.ITransactionRepository)
        transactionRepository: ITransactionRepository,
    ) {
        this.transactionSourceProvider = transactionSourceProvider;
        this.paymentDetailsContext = paymentDetailsContext;
        this.transactionFactory = transactionFactory;
        this.transactionRepository = transactionRepository;
    }

    public async * generateAsync(transactionIdsQuery?: string) {
        for await (const transactionId of this.generateTransactionIdsAsync(transactionIdsQuery)) {
            const transaction = await this.getTransactionOrNullAsync(transactionId);

            yield transaction;
        }

        return [];
    }

    public async * generateSaveAsync() {
        for await (const transactionId of this.generateTransactionIdsAsync()) {
            if (await this.transactionExistsAsync(transactionId)) {
                console.log(`Transaction from message ID ${transactionId} already exists`);

                yield null;
                
                continue;
            }

            const transaction = await this.getTransactionOrNullAsync(transactionId);

            if (transaction === null) {
                yield null;

                continue;
            }

            await this.addTransactionAsync(transaction);

            yield transaction;
        }

        return [];
    }

    private generateTransactionIdsAsync(transactionIdsQuery?: string) {
        return transactionIdsQuery !== undefined
            ? this.generateTransactionIdsFromQuery(transactionIdsQuery)
            : this.transactionSourceProvider.generateTransactionIdsAsync();
    }

    private * generateTransactionIdsFromQuery(transactionIdsQuery: string) {
        const transactionIds = transactionIdsQuery.split(',');
    
        for (const idx in transactionIds) {
            const transactionId = transactionIds[idx];
    
            yield transactionId;
        }
    }

    private async getTransactionOrNullAsync(transactionId: string) {
        console.log(`Processing transaction with ID ${transactionId}`);

        try {
            const transactionData = await this.transactionSourceProvider.getTransactionDataAsync(transactionId);

            const paymentDetails = this.paymentDetailsContext.get(
                transactionData.reference,
                transactionData.transactionType,
                transactionData.paymentDetailsRaw,
                transactionData.additionalDetailsRawOrNull);

            const transaction = this.transactionFactory.create(transactionId, transactionData, paymentDetails);
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

            return transaction;
        } catch(ex) {
            if (ex instanceof Error) {
                console.log(`${ex.message}\n\n${ex.stack}`);

                return null;
            }

            throw ex;
        }
    }

    private async transactionExistsAsync(transactionId: string) { 
        return this.transactionRepository.existsAsync(transactionId);
    }

    private async addTransactionAsync(transaction: Transaction<PaymentDetails>) {
        console.log(`Adding transaction with message ID ${transaction.id} of type ${TransactionTypeExtensions.ToString(transaction.type)} to database`);

        await this.transactionRepository.createAsync(transaction);
        
        console.log(`Successfully added transaction with message ID ${transaction.id}`);
    }
}