import { injectable } from "inversify";
import PaymentDetails from "../../core/models/paymentDetails";
import Transaction from "../../core/models/transaction";
import { TransactionData } from "../../core/models/transactionData";

@injectable()
export default class TransactionFactory {
    public create(id: string, transactionData: TransactionData, paymentDetails: PaymentDetails): Transaction<PaymentDetails> {
        const transaction: Transaction<PaymentDetails> = {
            id: id,
            date: transactionData.date,
            reference: transactionData.reference,
            valueDate: transactionData.valueDate,
            sum: transactionData.sum,
            entryType: transactionData.entryType,
            type: transactionData.transactionType,
            paymentDetails: paymentDetails
        }

        return transaction;
    }
}