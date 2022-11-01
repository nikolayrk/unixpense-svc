import EntryType from "../enums/entryType";
import TransactionType from "./transactionType";

export default interface Transaction<T extends TransactionType> {
    messageId: string;
    date: number;
    reference: string;
    valueDate: number;
    sum: number;
    entryType: EntryType;
    paymentDetails: T;
}