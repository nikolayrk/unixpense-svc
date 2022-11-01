import TransactionType from "./transactionType";

export default interface CardOperation extends TransactionType {
    instrument: string;
    sum: number;
    currency: string;
}
