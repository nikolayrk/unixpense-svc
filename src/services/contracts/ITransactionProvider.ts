import PaymentDetails from "../../shared/models/paymentDetails";
import Transaction from "../../shared/models/transaction";

export default interface ITransactionProvider {
    generateAsync(transactionIdsQuery?: string): AsyncGenerator<string, never[], unknown>;

    resolveTransactionOrNullAsync(transactionId: string): Promise<Transaction<PaymentDetails> | null>;
}