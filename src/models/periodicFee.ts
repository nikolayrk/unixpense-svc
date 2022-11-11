import TransactionType from "./transactionType";

export default interface PeriodicFee extends TransactionType {
    details: string;
}