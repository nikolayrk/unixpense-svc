import { inject, injectable } from "inversify";
import TransactionType from "../enums/transactionType";
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";
import UnsupportedTxnError from "../errors/unsupportedTxnError";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import PaymentDetails from "../models/paymentDetails";
import { AbstractPaymentDetailsStrategy } from "../strategies/abstractPaymentDetailsStrategy";
import { injectables } from "../types/injectables";
import { ICardOperationStrategy, ICrossBorderTransferStrategy, IDeskWithdrawalStrategy, IStandardFeeStrategy, IStandardTransferStrategy } from "../types/paymentDetailsStrategies";

@injectable()
export default class PaymentDetailsContext {
    private static readonly defaultPaymentDetails: PaymentDetails = {
        beneficiary: '<N/A>'
    };
    
    private readonly cardOperationStrategy;
    private readonly crossBorderTransferStrategy;
    private readonly deskWithdrawalStrategy;
    private readonly standardFeeStrategy;
    private readonly standardTransferStrategy;

    public constructor(
        @inject(injectables.ICardOperationStrategy)
        cardOperationStrategy: ICardOperationStrategy,

        @inject(injectables.ICrossBorderTransferStrategy)
        crossBorderTransferStrategy: ICrossBorderTransferStrategy,

        @inject(injectables.IDeskWithdrawalStrategy)
        deskWithdrawalStrategy: IDeskWithdrawalStrategy,

        @inject(injectables.IStandardFeeStrategy)
        standardFeeStrategy: IStandardFeeStrategy,

        @inject(injectables.IStandardTransferStrategy)
        standardTransferStrategy: IStandardTransferStrategy
    ) {
        this.cardOperationStrategy = cardOperationStrategy;
        this.crossBorderTransferStrategy = crossBorderTransferStrategy;
        this.deskWithdrawalStrategy = deskWithdrawalStrategy;
        this.standardFeeStrategy = standardFeeStrategy;
        this.standardTransferStrategy = standardTransferStrategy;
    }

    // throws UnsupportedTxnError, PaymentDetailsProcessingError
    public get(reference: string, transactionType: TransactionType, paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null) {
        try {
            const paymentDetailsStrategy = this.tryGetStrategyByType(transactionType);
            const paymentDetails = paymentDetailsStrategy.tryCreate(reference, paymentDetailsRaw, additionalDetailsRawOrNull);
        
            return paymentDetails;
        } catch(ex) {
            if ((ex instanceof UnsupportedTxnError || ex instanceof PaymentDetailsProcessingError) === false) {
                throw new PaymentDetailsProcessingError(reference, String(ex), (ex as Error)?.stack);
            }

            const exception = ex as UnsupportedTxnError | PaymentDetailsProcessingError;

            console.log(exception.message);
            console.log('Falling back to using default payment details body...');
        }

        return PaymentDetailsContext.defaultPaymentDetails;
    }
    
    // throws UnsupportedTxnError
    private tryGetStrategyByType(transactionType: TransactionType): AbstractPaymentDetailsStrategy<PaymentDetails> {  
        if (TransactionTypeExtensions.IsCardOperation(transactionType)) {
            return this.cardOperationStrategy;
        } else if (TransactionTypeExtensions.IsCrossBorderTransfer(transactionType)) {
            return this.crossBorderTransferStrategy;
        } else if (TransactionTypeExtensions.IsDeskWithdrawal(transactionType)) {
            return this.deskWithdrawalStrategy;
        } else if (TransactionTypeExtensions.IsStandardFee(transactionType)) {
            return this.standardFeeStrategy;
        } else if (TransactionTypeExtensions.IsStandardTransfer(transactionType)) {
            return this.standardTransferStrategy;
        } else {
            throw new UnsupportedTxnError(transactionType);
        }
    }
}