import EntryType from "../enums/entryType";
import TransactionType from "../enums/transactionType";
import PaymentDetails from "./paymentDetails";

export default interface Transaction<T extends PaymentDetails> {
    messageId: string;
    date: number;
    reference: string;
    valueDate: number;
    sum: number;
    entryType: EntryType;
    type: TransactionType;
    paymentDetails: T;
}