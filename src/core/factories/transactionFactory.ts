import { injectable } from "inversify";
import PaymentDetails from "../types/paymentDetails";
import Transaction from "../types/transaction";
import TransactionData from "../types/transactionData";

@injectable()
export default class TransactionFactory {
    public static create(id: string, transactionData: TransactionData, paymentDetails: PaymentDetails): Transaction<PaymentDetails> {
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