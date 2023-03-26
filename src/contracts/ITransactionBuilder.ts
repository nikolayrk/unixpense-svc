import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default interface ITransactionBuilder {
    // throws FailedToProcessTxnError
    tryBuildAsync(messageId: string): Promise<Transaction<PaymentDetails>>;
}