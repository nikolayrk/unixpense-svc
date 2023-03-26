import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";

export default interface ITransactionFactory {
    create(messageId: string, attachmentData: string): Transaction<PaymentDetails>
}