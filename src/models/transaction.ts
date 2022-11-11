import EntryType from "../enums/entryType";
import PaymentDetails from "./paymentDetails";

export default interface Transaction<T extends PaymentDetails> {
    messageId: string;
    date: number;
    reference: string;
    valueDate: number;
    sum: number;
    entryType: EntryType;
    paymentDetails: T;
}