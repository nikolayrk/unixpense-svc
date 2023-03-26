import TransactionType from "../enums/transactionType";

export default class UnsupportedTxnError extends Error {
    public message: string;

    constructor(type: TransactionType) {
        const message = `Unsupported transaction type: ${type}`;

        super(message);

        this.name = "UnsupportedTxnError";
        this.message = message;
    }
}
  