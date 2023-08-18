import { DataType } from 'sequelize-typescript';
import TransactionType from '../enums/transactionType';

export class TransactionTypeExtensions {
    public static keys() {
        return Object.keys(TransactionType).filter(k => isNaN(Number(k)));
    }

    public static toString(value: TransactionType) {
        const ordinal = Number(TransactionTypeExtensions.toOrdinalEnum(String(value)));
        const numberValue = Number(value);
        const index = Number.isNaN(numberValue)
            ? ordinal
            : numberValue;

        return this.keys()[index];
    }

    public static toDataType() {
        return DataType.ENUM(...this.keys());
    }

    public static toEnum(value: string) {
        return <TransactionType> <unknown> value;
    }

    public static toOrdinalEnum(value: string) {
        return Object.entries(TransactionType).find(e => e[0] === value)?.[1] as TransactionType;
    }

    public static isCardOperation(transactionType: TransactionType) {
        return transactionType === TransactionType.CARD_OPERATION;
    }

    public static isCrossBorderTransfer(transactionType: TransactionType) {
        return transactionType === TransactionType.CROSS_BORDER_TRANSFER
    }

    public static isCrossBorderTransferFee(transactionType: TransactionType) {
        return transactionType === TransactionType.CROSS_BORDER_TRANSFER_FEE;
    }

    public static isDeskWithdrawal(transactionType: TransactionType) {
        return transactionType === TransactionType.DESK_WITHDRAWAL;
    }

    public static isStandardFee(transactionType: TransactionType) {
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

    public static isStandardTransfer(transactionType: TransactionType) {
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
