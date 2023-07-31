import PaymentDetails from "../../core/models/paymentDetails";
import Transaction from "../../core/models/transaction";

export default interface ITransactionProvider {
    generateAsync(transactionIdsQuery?: string): AsyncGenerator<string, never[], unknown>;

    resolveTransactionAsync(transactionId: string): Promise<Transaction<PaymentDetails>>;
}