import TransactionType from "../enums/transactionType";

export default class UnsupportedTxnError extends Error {
    constructor(type: TransactionType) {
        const message = `Unsupported transaction type '${type}'`;

        super(message);

        this.name = "UnsupportedTxnError";
    }
}
  