export default interface ITransactionSourceProvider {
    generateTransactionIdsAsync(): AsyncGenerator<string, [], undefined>;

    getAsync(transactionId: string): Promise<string>;
}