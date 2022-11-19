import { Node } from 'node-html-parser';
import UnsupportedTxnError from '../errors/unsupportedTxnError';
import PaymentDetailsProcessingError from '../errors/paymentDetailsProcessingError';
import TransactionType from '../enums/transactionType';
import PaymentDetailsFactory from '../models/paymentDetailsFactory';
import CardOperationFactory from '../factories/cardOperationFactory';
import CrossBorderTransferFactory from '../factories/crossBorderTransferFactory';
import StandardFeeFactory from '../factories/standardFeeFactory';
import StandardTransferFactory from '../factories/standardTransferFactory';
import PaymentDetails from '../models/paymentDetails';

export default class PaymentDetailsBuilder {
    public tryBuild(transactionType: TransactionType, transactionDetails: Node[]) {
        try {
            const paymentDetailsFactory = this.constructPaymentDetailsFactory(transactionType);
            const paymentDetails = paymentDetailsFactory.create(transactionDetails);

            return paymentDetails;
        } catch(ex) {
            if (ex instanceof UnsupportedTxnError ||
                ex instanceof PaymentDetailsProcessingError) {
                console.log(`Failed to construct payment details. Reason: ${ex.message}. Falling back to using empty payment details body...`);

                return null;
            }

            throw ex;
        }
    }

    private constructPaymentDetailsFactory(transactionType: TransactionType): PaymentDetailsFactory<PaymentDetails> {        
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
}