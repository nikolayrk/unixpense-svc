import TransactionData from "../models/transactionData";

export default interface ITransactionSourceProvider {
    generateTransactionIdsAsync(): AsyncGenerator<string, [], undefined>;

    getTransactionDataAsync(transactionId: string): Promise<TransactionData>;
}