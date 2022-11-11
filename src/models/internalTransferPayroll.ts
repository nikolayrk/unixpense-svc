import TransactionType from "./transactionType";

export default interface InternalTransferPayroll extends TransactionType {
    iban: string;
    details: string;
}
