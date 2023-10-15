import { TransactionTypeExtensions } from "../../core/extensions/transactionTypeExtensions";

const transactionTypes = {
    type: "string",
    enum: TransactionTypeExtensions.keys()
};

export { transactionTypes };