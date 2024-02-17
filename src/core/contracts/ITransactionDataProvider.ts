import TransactionData from "../types/transactionData";

export default interface ITransactionDataProvider {
    get(transactionDataRaw: string): TransactionData
}