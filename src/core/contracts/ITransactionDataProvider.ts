import { TransactionData } from "../../core/models/transactionData";

export default interface ITransactionDataProvider {
    get(transactionDataRaw: string): TransactionData
}