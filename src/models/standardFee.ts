import TransactionType from "./transactionType";

export default interface StandardFee extends TransactionType {
    type: string
    description: string;
}