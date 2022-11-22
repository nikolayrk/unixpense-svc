import EntryType from "../enums/entryType";
import TransactionType from "../enums/transactionType";
import PaymentDetails from "./paymentDetails";

export default interface Transaction<T extends PaymentDetails> {
    messageId: string;
    date: Date;
    reference: string;
    valueDate: Date;
    sum: string;
    entryType: EntryType;
    type: TransactionType;
    paymentDetails: T;
}