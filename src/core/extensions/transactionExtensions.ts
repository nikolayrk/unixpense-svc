import TransactionType from "../enums/transactionType";
import PaymentDetails from "../models/paymentDetails";
import StandardTransfer from "../models/standardTransfer";
import Transaction from "../models/transaction";
import { EntryTypeExtensions } from "./entryTypeExtensions";
import { TransactionTypeExtensions } from "./transactionTypeExtensions";

export class TransactionExtensions {
    public static MapTransactionEntity(transaction: Transaction<PaymentDetails>) {
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

            ...(TransactionExtensions.IsStandardTransfer(transaction.type)) && {
                standard_transfer: TransactionExtensions.MapStandardTransferEntity(transaction.paymentDetails as StandardTransfer)
            },
        };
    }

    public static MapStandardTransferEntity(standardTransfer: StandardTransfer) {
        const mappedStandardTransfer: any = standardTransfer;

        delete Object.assign(mappedStandardTransfer, { recipient_iban: standardTransfer.recipientIban })[standardTransfer.recipientIban];

        return mappedStandardTransfer;
    }

    public static MapTransactionResponse(transaction: Transaction<PaymentDetails>) {
        return {
            id: transaction.id,
            date: `${transaction.date.toDateString()} ${transaction.date.toLocaleTimeString()}`,
            reference: transaction.reference,
            value_date: transaction.valueDate.toDateString(),
            sum: Number(transaction.sum),
            entry_type: EntryTypeExtensions.ToString(transaction.entryType),
            type: TransactionTypeExtensions.ToString(transaction.type),

            ...TransactionTypeExtensions.IsCardOperation(transaction.type) && {
                card_operation: transaction.paymentDetails
            },

            ...(TransactionExtensions.IsStandardTransfer(transaction.type)) && {
                standard_transfer: transaction.paymentDetails
            },
        };
    }

    private static IsStandardTransfer = (transactionType: TransactionType) => 
        TransactionTypeExtensions.IsCrossBorderTransfer(transactionType) ||
        TransactionTypeExtensions.IsCrossBorderTransferFee(transactionType) ||
        TransactionTypeExtensions.IsDeskWithdrawal(transactionType) ||
        TransactionTypeExtensions.IsStandardFee(transactionType) ||
        TransactionTypeExtensions.IsStandardTransfer(transactionType);
}