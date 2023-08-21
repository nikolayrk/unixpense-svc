import Constants from "../../constants";
import TransactionType from "../enums/transactionType";
import TransactionFactory from "../factories/transactionFactory";
import PaymentDetails from "../models/paymentDetails";
import StandardTransfer from "../models/standardTransfer";
import Transaction from "../models/transaction";
import { TransactionData } from "../models/transactionData";
import { EntryTypeExtensions } from "./entryTypeExtensions";
import { TransactionTypeExtensions } from "./transactionTypeExtensions";

export class TransactionExtensions {
    public static toEntity(transaction: Transaction<PaymentDetails>) {
        return {
            id: transaction.id,
            date: transaction.date.toSqlDate(),
            reference: transaction.reference,
            value_date: transaction.valueDate.toSqlDate(),
            sum: transaction.sum,
            entry_type: EntryTypeExtensions.toString(transaction.entryType),
            type: TransactionTypeExtensions.toString(transaction.type),

            ...TransactionTypeExtensions.isCardOperation(transaction.type) && {
                card_operation: transaction.paymentDetails
            },

            ...(TransactionExtensions.isStandardTransfer(transaction.type)) && {
                standard_transfer: TransactionExtensions.toStandardTransferEntity(transaction.paymentDetails as StandardTransfer)
            },
        };
    }

    public static toResponse(transaction: Transaction<PaymentDetails>) {
        return {
            id: transaction.id,
            date: transaction.date.toISOString(),
            reference: transaction.reference,
            value_date: transaction.valueDate.toISOString(),
            sum: Number(transaction.sum),
            entry_type: EntryTypeExtensions.toString(transaction.entryType),
            type: TransactionTypeExtensions.toString(transaction.type),

            ...TransactionTypeExtensions.isCardOperation(transaction.type) && {
                card_operation: transaction.paymentDetails
            },

            ...(TransactionExtensions.isStandardTransfer(transaction.type)) && {
                standard_transfer: transaction.paymentDetails
            },
        };
    }

    public static toModel(transaction: Record<string, string | number | object>) {
        const transactionData: TransactionData = {
            date: new Date(String(transaction.date)),
            reference: String(transaction.reference),
            valueDate: new Date(String(transaction.value_date)),
            sum: String(transaction.sum),
            entryType: EntryTypeExtensions.toOrdinalEnum(String(transaction.entry_type)),
            transactionType: TransactionTypeExtensions.toOrdinalEnum(String(transaction.type)),
            paymentDetailsRaw: [''],
            additionalDetailsRaw: ['']
        }

        const paymentDetails = (transaction.card_operation ?? transaction.standard_transfer) as PaymentDetails
            ?? Constants.defaultPaymentDetails;

        return TransactionFactory.create(String(transaction.id), transactionData, paymentDetails);
    }

    private static isStandardTransfer = (transactionType: TransactionType) => 
        TransactionTypeExtensions.isCrossBorderTransfer(transactionType) ||
        TransactionTypeExtensions.isCrossBorderTransferFee(transactionType) ||
        TransactionTypeExtensions.isDeskWithdrawal(transactionType) ||
        TransactionTypeExtensions.isStandardFee(transactionType) ||
        TransactionTypeExtensions.isStandardTransfer(transactionType);

    private static toStandardTransferEntity(standardTransfer: StandardTransfer) {
        const mappedStandardTransfer: any = standardTransfer;

        delete Object.assign(mappedStandardTransfer, { recipient_iban: standardTransfer.recipientIban })[standardTransfer.recipientIban];

        return mappedStandardTransfer;
    }
}