import TransactionType from "../enums/transactionType";
import UnsupportedTxnError from "../errors/unsupportedTxnError";
import CardOperationFactory from "../factories/cardOperationFactory";
import CrossBorderTransferFactory from "../factories/crossBorderTransferFactory";
import StandardFeeFactory from "../factories/standardFeeFactory";
import StandardTransferFactory from "../factories/standardTransferFactory";
import PaymentDetails from "../models/paymentDetails";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";

export default function constructPaymentDetailsFactory(transactionType: TransactionType): PaymentDetailsFactory<PaymentDetails> {        
    switch(transactionType) {
        case TransactionType.CARD_OPERATION:
            return new CardOperationFactory();

        case TransactionType.CROSS_BORDER_TRANSFER:
            return new CrossBorderTransferFactory();

        case TransactionType.PERIODIC_FEE:
        case TransactionType.INTERBANK_TRANSFER_FEE:
        case TransactionType.TRANSFER_FEE:
        case TransactionType.CROSS_BORDER_TRANSFER_FEE:
        case TransactionType.INTERNAL_TRANSFER_FEE:
        case TransactionType.WITHDRAWAL_FEE:
        case TransactionType.DESK_WITHDRAWAL_FEE:
            return new StandardFeeFactory();
        
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
            return new StandardTransferFactory();

        default:
            throw new UnsupportedTxnError('Unsupported transaction type');
    }
}