export default class UnsupportedTxnError extends Error {
    constructor(transactionType: string) {
        const message = `Unsupported transaction type '${transactionType}'`;

        super(message);

        this.name = "UnsupportedTxnError";
    }
}
  