import { TransactionData } from "../../shared/models/transactionData";

export default interface ITransactionDataProvider {
    get(transactionDataRaw: string): TransactionData
}