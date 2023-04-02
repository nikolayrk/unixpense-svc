import TransactionData from "../models/transactionData";

export default interface ITransactionDataProvider {
    get(transactionDataRaw: string): TransactionData
}