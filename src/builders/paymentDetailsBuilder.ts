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
    private readonly cardOperationFactory: CardOperationFactory;
    private readonly crossBorderTransferFactory: CrossBorderTransferFactory;
    private readonly standardFeeFactory: StandardFeeFactory;
    private readonly standardTransferFactory: StandardTransferFactory;

    public constructor(
        cardOperationFactory: CardOperationFactory,
        crossBorderTransferFactory: CrossBorderTransferFactory,
        standardFeeFactory: StandardFeeFactory,
        standardTransferFactory: StandardTransferFactory
    ) {
        this.cardOperationFactory = cardOperationFactory;
        this.crossBorderTransferFactory = crossBorderTransferFactory;
        this.standardFeeFactory = standardFeeFactory;
        this.standardTransferFactory = standardTransferFactory;
    }

    public tryBuild(transactionType: TransactionType, transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node) {
        try {
            const paymentDetailsFactory = this.usePaymentDetailsFactoryByType(transactionType);
            const paymentDetails = paymentDetailsFactory.create(transactionDetailsNodes, additionalTransactionDetailsNode);

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

    private usePaymentDetailsFactoryByType(transactionType: TransactionType): PaymentDetailsFactory<PaymentDetails> {  
        if (TransactionTypeExtensions.IsCardOperation(transactionType)) {
            return this.cardOperationFactory;
        } else if (TransactionTypeExtensions.IsCrossBorderTransfer(transactionType)) {
            return this.crossBorderTransferFactory;
        } else if (TransactionTypeExtensions.IsStandardFee(transactionType)) {
            return this.standardFeeFactory;
        } else if (TransactionTypeExtensions.IsStandardTransfer(transactionType)) {
            return this.standardTransferFactory;
        } else {
            throw new UnsupportedTxnError('Unsupported transaction type');
        }
    }
}