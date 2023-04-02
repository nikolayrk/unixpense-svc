import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default interface ITransactionRepository {
    createAsync(transaction: Transaction<PaymentDetails>): Promise<void>;

    existsAsync(transactionId: string): Promise<boolean>;
}