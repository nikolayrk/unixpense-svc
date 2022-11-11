import TransactionType from "./transactionType";

export default interface InterestPaymentTax extends TransactionType {
    iban: string;
    details: string;
}
