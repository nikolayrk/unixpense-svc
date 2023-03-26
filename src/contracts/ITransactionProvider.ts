import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default interface ITransactionProvider {
    generateAsync(query?: string): AsyncGenerator<Transaction<PaymentDetails> | null, never[], unknown>;

    generateSaveAsync(): AsyncGenerator<Transaction<PaymentDetails> | null, never[], unknown>;
}