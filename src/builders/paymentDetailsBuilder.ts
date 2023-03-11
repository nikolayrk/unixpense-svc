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
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";

export default class PaymentDetailsBuilder {
    public tryBuild(transactionType: TransactionType, transactionDetailsNodes: Node[]) {
        try {
            const paymentDetailsFactory = this.constructPaymentDetailsFactory(transactionType);
            const paymentDetails = paymentDetailsFactory.create(transactionDetailsNodes);

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
        if (TransactionTypeExtensions.IsCardOperation(transactionType)) {
            return new CardOperationFactory();
        } else if (TransactionTypeExtensions.IsCrossBorderTransfer(transactionType)) {
            return new CrossBorderTransferFactory();
        } else if (TransactionTypeExtensions.IsStandardFee(transactionType)) {
            return new StandardFeeFactory();
        } else if (TransactionTypeExtensions.IsStandardTransfer(transactionType)) {
            return new StandardTransferFactory();
        } else {
            throw new UnsupportedTxnError('Unsupported transaction type');
        }
    }
}