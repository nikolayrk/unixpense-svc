import EntryType from "../enums/entryType";
import TransactionType from "./transactionType";

export default interface Transaction<T extends TransactionType> {
    messageId: string;
    date: number;
    referece: string;
    valueDate: number;
    sum: number;
    entryType: EntryType;
    description: T
}