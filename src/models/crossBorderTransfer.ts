import TransactionType from "./transactionType";

export default interface CrossBorderTransfer extends TransactionType {
    iban: string;
    description: string;
}