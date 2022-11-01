export default class UnsupportedTransactionError extends Error {
    constructor(transactionType: string) {
        const message = `Unsupported transaction type '${transactionType}'`;

        super(message);

        this.name = "UnsupportedTransactionError";
    }
}
  