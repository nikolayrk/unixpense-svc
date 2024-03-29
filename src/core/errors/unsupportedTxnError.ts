import TransactionType from "../enums/transactionType";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";

export default class UnsupportedTxnError extends Error {
    constructor(type: TransactionType) {
        const message = `Unsupported transaction type '${TransactionTypeExtensions.toString(type)}'`;

        super(message);

        this.name = "UnsupportedTxnError";
    }
}
  