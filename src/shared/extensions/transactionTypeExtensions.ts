import { DataType } from 'sequelize-typescript';
import TransactionType from '../enums/transactionType';
import StandardTransfer from '../models/standardTransfer';

export class TransactionTypeExtensions {
    public static Keys() {
        return Object.keys(TransactionType).filter(k => isNaN(Number(k)));
    }
    public static ToString(transactionType: TransactionType) {
        return Object.keys(TransactionType)[Object.values(TransactionType).indexOf(transactionType)];
    }

    public static ToDataType() {
        return DataType.ENUM(...this.Keys());
    }

    public static IsCardOperation(transactionType: TransactionType) {
        return transactionType === TransactionType.CARD_OPERATION;
    }

    public static IsCrossBorderTransfer(transactionType: TransactionType) {
        return transactionType === TransactionType.CROSS_BORDER_TRANSFER
    }

    public static IsCrossBorderTransferFee(transactionType: TransactionType) {
        return transactionType === TransactionType.CROSS_BORDER_TRANSFER_FEE;
    }

    public static IsDeskWithdrawal(transactionType: TransactionType) {
        return transactionType === TransactionType.DESK_WITHDRAWAL;
    }

    public static IsStandardFee(transactionType: TransactionType) {
        switch (transactionType) {
            case TransactionType.PERIODIC_FEE:
            case TransactionType.INTERBANK_TRANSFER_FEE:
            case TransactionType.TRANSFER_FEE:
            case TransactionType.CROSS_BORDER_TRANSFER_FEE:
            case TransactionType.INTERNAL_TRANSFER_FEE:
            case TransactionType.WITHDRAWAL_FEE:
                return true;
            default:
                return false;
        }
    }

    public static IsStandardTransfer(transactionType: TransactionType) {
        switch (transactionType) {
            case TransactionType.INTEREST_PAYMENT:
            case TransactionType.INTEREST_TAX:
            case TransactionType.INTERNAL_TRANSFER:
            case TransactionType.INTERBANK_TRANSFER:
            case TransactionType.UTILITY_PAYMENT:
            case TransactionType.RECEIVED_INTERBANK_TRANSFER:
            case TransactionType.RECEIVED_INTERNAL_PAYMENT:
            case TransactionType.PERIODIC_PAYMENT:
            case TransactionType.PRINCIPAL_REPAYMENT:
            case TransactionType.INSURANCE_PREMIUM:
            case TransactionType.INTEREST_REPAYMENT:
                return true;
            default:
                return false;
        }
    }
}
