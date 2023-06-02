import PaymentDetails from "../models/paymentDetails";
import StandardTransfer from "../models/standardTransfer";
import Transaction from "../models/transaction";
import { EntryTypeExtensions } from "./entryTypeExtensions";
import { TransactionTypeExtensions } from "./transactionTypeExtensions";

export class TransactionExtensions {
    public static MapTransaction(transaction: Transaction<PaymentDetails>) {
        return {
            id: transaction.id,
            date: transaction.date.toSqlDate(),
            reference: transaction.reference,
            value_date: transaction.valueDate.toSqlDate(),
            sum: transaction.sum,
            entry_type: EntryTypeExtensions.ToString(transaction.entryType),
            type: TransactionTypeExtensions.ToString(transaction.type),

            ...TransactionTypeExtensions.IsCardOperation(transaction.type) && {
                card_operation: transaction.paymentDetails
            },

            ...(TransactionTypeExtensions.IsCrossBorderTransfer(transaction.type) ||
                TransactionTypeExtensions.IsCrossBorderTransferFee(transaction.type) ||
                TransactionTypeExtensions.IsDeskWithdrawal(transaction.type) ||
                TransactionTypeExtensions.IsStandardFee(transaction.type) ||
                TransactionTypeExtensions.IsStandardTransfer(transaction.type)) && {
                standard_transfer: TransactionExtensions.MapStandardTransfer(transaction.paymentDetails as StandardTransfer)
            },
        };
    }

    public static MapStandardTransfer(standardTransfer: StandardTransfer) {
        const mappedStandardTransfer: any = standardTransfer;

        delete Object.assign(mappedStandardTransfer, { recipient_iban: standardTransfer.recipientIban })[standardTransfer.recipientIban];

        return mappedStandardTransfer;
    }
}