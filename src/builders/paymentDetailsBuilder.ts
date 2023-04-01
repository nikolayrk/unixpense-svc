import { Node } from 'node-html-parser';
import UnsupportedTxnError from '../errors/unsupportedTxnError';
import TransactionType from '../enums/transactionType';
import { IPaymentDetailsFactory, ICardOperationFactory } from '../contracts/IPaymentDetailsFactory';
import PaymentDetails from '../models/paymentDetails';
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import { inject, injectable } from 'inversify';
import CrossBorderTransfer from '../models/crossBorderTransfer';
import StandardFee from '../models/standardFee';
import StandardTransfer from '../models/standardTransfer';
import { injectables } from "../types/injectables";
import DeskWithdrawal from '../models/deskWithdrawal';

@injectable()
export default class PaymentDetailsBuilder {
    private readonly cardOperationFactory;
    private readonly crossBorderTransferFactory;
    private readonly deskWithdrawalFactory;
    private readonly standardFeeFactory;
    private readonly standardTransferFactory;

    public constructor(
        @inject(injectables.ICardOperationFactory)
        cardOperationFactory: ICardOperationFactory,

        @inject(injectables.ICrossBorderTransferFactory)
        crossBorderTransferFactory: IPaymentDetailsFactory<CrossBorderTransfer>,

        @inject(injectables.IDeskWithdrawalFactory)
        deskWithdrawalFactory: IPaymentDetailsFactory<DeskWithdrawal>,

        @inject(injectables.IStandardFeeFactory)
        standardFeeFactory: IPaymentDetailsFactory<StandardFee>,

        @inject(injectables.IStandardTransferFactory)
        standardTransferFactory: IPaymentDetailsFactory<StandardTransfer>
    ) {
        this.cardOperationFactory = cardOperationFactory;
        this.crossBorderTransferFactory = crossBorderTransferFactory;
        this.deskWithdrawalFactory = deskWithdrawalFactory;
        this.standardFeeFactory = standardFeeFactory;
        this.standardTransferFactory = standardTransferFactory;
    }

    // throws UnsupportedTxnError, PaymentDetailsProcessingError
    public tryBuild(transactionReference: string, transactionType: TransactionType, transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node) {
        const paymentDetailsFactory = this.tryUsePaymentDetailsFactoryByType(transactionType);
        const paymentDetails = paymentDetailsFactory.tryCreate(transactionReference, transactionDetailsNodes, additionalTransactionDetailsNode);

        return paymentDetails;
    }

    // throws UnsupportedTxnError
    private tryUsePaymentDetailsFactoryByType(transactionType: TransactionType): IPaymentDetailsFactory<PaymentDetails> {  
        if (TransactionTypeExtensions.IsCardOperation(transactionType)) {
            return this.cardOperationFactory;
        } else if (TransactionTypeExtensions.IsCrossBorderTransfer(transactionType)) {
            return this.crossBorderTransferFactory;
        } else if (TransactionTypeExtensions.IsDeskWithdrawal(transactionType)) {
            return this.deskWithdrawalFactory;
        } else if (TransactionTypeExtensions.IsStandardFee(transactionType)) {
            return this.standardFeeFactory;
        } else if (TransactionTypeExtensions.IsStandardTransfer(transactionType)) {
            return this.standardTransferFactory;
        } else {
            throw new UnsupportedTxnError(transactionType);
        }
    }
}