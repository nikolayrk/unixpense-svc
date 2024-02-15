import PaymentDetails from "../types/paymentDetails";
import Transaction from "../types/transaction";

export default interface ITransactionProvider {
    generateAsync(): AsyncGenerator<string, never[], unknown>;

    resolveTransactionAsync(transactionId: string): Promise<Transaction<PaymentDetails>>;
}