import TransactionType from "./transactionType";

export default interface StandardTransfer extends TransactionType {
    type: string;
    iban: string;
    description: string;
}