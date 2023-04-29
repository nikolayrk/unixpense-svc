import PaymentDetails from "../../shared/models/paymentDetails"
import Transaction from "../../shared/models/transaction"

export default interface ITransactionProvider {
    generateAsync(transactionIdsQuery?: string): AsyncGenerator<Transaction<PaymentDetails> | null, never[], unknown>;
    generateSaveAsync(transactionIdsQuery?: string): AsyncGenerator<Transaction<PaymentDetails> | null, never[], unknown>;
}