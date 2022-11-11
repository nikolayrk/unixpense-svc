import TransactionType from "./transactionType";

export default interface InterestPayment extends TransactionType {
    iban: string;
    details: string;
}
