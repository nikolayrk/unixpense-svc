import EntryType from "../enums/entryType";
import TransactionType from "../enums/transactionType";

export default interface TransactionData {
    date: Date,
    reference: string,
    valueDate: Date,
    sum: string,
    entryType: EntryType,
    transactionType: TransactionType,
    paymentDetailsRaw: string[],
    additionalDetailsRaw: string[]
}