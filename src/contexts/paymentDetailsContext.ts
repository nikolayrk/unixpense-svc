import { inject, injectable } from "inversify";
import TransactionType from "../enums/transactionType";
import UnsupportedTxnError from "../errors/unsupportedTxnError";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import PaymentDetails from "../models/paymentDetails";
import { AbstractPaymentDetailsStrategy } from "../strategies/abstractPaymentDetailsStrategy";
import { injectables } from "../types/injectables";
import { ICardOperationStrategy, ICrossBorderTransferStrategy, IDeskWithdrawalStrategy, IStandardFeeStrategy, IStandardTransferStrategy } from "../types/paymentDetailsStrategies";
import ILogger from "../contracts/ILogger";

@injectable()
export default class PaymentDetailsContext {
    private static readonly defaultPaymentDetails: PaymentDetails = {
        beneficiary: '<N/A>'
    };
    
    private readonly logger;
    private readonly cardOperationStrategy;
    private readonly crossBorderTransferStrategy;
    private readonly deskWithdrawalStrategy;
    private readonly standardFeeStrategy;
    private readonly standardTransferStrategy;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

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
        this.logger = logger;
        this.cardOperationStrategy = cardOperationStrategy;
        this.crossBorderTransferStrategy = crossBorderTransferStrategy;
        this.deskWithdrawalStrategy = deskWithdrawalStrategy;
        this.standardFeeStrategy = standardFeeStrategy;
        this.standardTransferStrategy = standardTransferStrategy;
    }

    public resolve(reference: string, transactionType: TransactionType, paymentDetailsRaw: string[], additionalDetailsRaw: string[]) {
        try {
            const paymentDetailsStrategy = this.tryGetStrategyByType(transactionType);
            const paymentDetails = paymentDetailsStrategy.tryCreate(paymentDetailsRaw, additionalDetailsRaw);
        
            return paymentDetails;
        } catch(ex) {
            const error = ex as Error;
            
            this.logger.error(error, { transactionReference: reference });
        }

        this.logger.log(`Falling back to using default payment details body...`, {
            transactionReference: reference,
            transactionType: transactionType
        }
        );
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