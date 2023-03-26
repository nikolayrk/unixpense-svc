import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default interface ITransactionRepository {
    createAsync(transaction: Transaction<PaymentDetails>): Promise<void>;

    existsAsync(messageId: string): Promise<boolean>;
}