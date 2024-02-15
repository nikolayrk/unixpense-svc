import Constants from "../../constants";
import { default as CardOperationModel } from "../models/cardOperation.model";
import { default as StandardTransferModel } from "../models/standardTransfer.model";
import { default as TransactionModel } from "../models/transaction.model";
import TransactionType from "../enums/transactionType";
import TransactionFactory from "../factories/transactionFactory";
import CardOperation from "../types/cardOperation";
import PaymentDetails from "../types/paymentDetails";
import StandardTransfer from "../types/standardTransfer";
import Transaction from "../types/transaction";
import { TransactionData } from "../types/transactionData";
import { EntryTypeExtensions } from "./entryTypeExtensions";
import { TransactionTypeExtensions } from "./transactionTypeExtensions";

export class TransactionExtensions {
    public static toRecord(transaction: Transaction<PaymentDetails>) {
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
                standard_transfer: TransactionExtensions.toStandardTransferEntity(transaction.paymentDetails as StandardTransfer)
            },
        };
    }

    public static trimEntity(entity: TransactionModel) {
        const { date, value_date, ...rest } = entity.dataValues;

        if (date instanceof Date && value_date instanceof Date) {
            return entity.dataValues;
        }
        
        const utcDate = date.toUTCDate().toISOString();
        const utcValueDate = value_date.toUTCDate().toISOString();

        return { date: utcDate, value_date: utcValueDate, ...rest };
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

        const paymentDetails: PaymentDetails = transaction.card_operation !== undefined && transaction.card_operation !== null
            ? {
                recipient: (transaction.card_operation as CardOperationModel).recipient,
                instrument: (transaction.card_operation as CardOperationModel).instrument ?? undefined,
                sum: (transaction.card_operation as CardOperationModel).sum ?? undefined,
                currency: (transaction.card_operation as CardOperationModel).currency ?? undefined
            } as CardOperation
            : transaction.standard_transfer !== undefined && transaction.standard_transfer !== null
                ? {
                    recipient: (transaction.standard_transfer as StandardTransferModel).recipient,
                    recipientIban: (transaction.standard_transfer as StandardTransferModel).recipient_iban ?? undefined,
                    description: (transaction.standard_transfer as StandardTransferModel).description ?? undefined,
                } as StandardTransfer
                : Constants.defaultPaymentDetails;

        return TransactionFactory.create(String(transaction.id), transactionData, paymentDetails);
    }

    private static isStandardTransfer = (transactionType: TransactionType) => 
        TransactionTypeExtensions.isCrossBorderTransfer(transactionType) ||
        TransactionTypeExtensions.isCrossBorderTransferFee(transactionType) ||
        TransactionTypeExtensions.isDeskWithdrawal(transactionType) ||
        TransactionTypeExtensions.isStandardFee(transactionType) ||
        TransactionTypeExtensions.isStandardTransfer(transactionType);

    private static toStandardTransferEntity(standardTransfer: StandardTransfer) {
        const mappedStandardTransfer: any = JSON.parse(JSON.stringify(standardTransfer));

        delete Object.assign(mappedStandardTransfer, { recipient_iban: standardTransfer.recipientIban })[standardTransfer.recipientIban];

        return mappedStandardTransfer;
    }
}