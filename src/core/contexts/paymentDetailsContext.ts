import { inject, injectable } from "inversify";
import TransactionType from "../../core/enums/transactionType";
import UnsupportedTxnError from "../../core/errors/unsupportedTxnError";
import { TransactionTypeExtensions } from "../../core/extensions/transactionTypeExtensions";
import PaymentDetails from "../../core/models/paymentDetails";
import { AbstractPaymentDetailsStrategy } from "../strategies/abstractPaymentDetailsStrategy";
import { injectables } from "../../core/types/injectables";
import { ICardOperationStrategy,
    ICrossBorderTransferFeeStrategy,
    ICrossBorderTransferStrategy,
    IDeskWithdrawalStrategy,
    IStandardFeeStrategy,
    IStandardTransferStrategy } from "../../core/types/paymentDetailsStrategies";
import ILogger from "../../core/contracts/ILogger";
import Constants from "../../constants";

@injectable()
export default class PaymentDetailsContext {
    private readonly logger;
    private readonly cardOperationStrategy;
    private readonly crossBorderTransferStrategy;
    private readonly crossBorderTransferFeeStrategy;
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

        @inject(injectables.ICrossBorderTransferFeeStrategy)
        crossBorderTransferFeeStrategy: ICrossBorderTransferFeeStrategy,

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
        this.crossBorderTransferFeeStrategy = crossBorderTransferFeeStrategy;
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
            
            if (ex instanceof UnsupportedTxnError) {
                this.logger.warn(error.message, { transactionReference: reference });
            } else {
                this.logger.error(error, { transactionReference: reference });
            }
        }

        this.logger.log(`Falling back to using default payment details body...`, {
            transactionReference: reference,
            transactionType: transactionType
        });
        
        return Constants.defaultPaymentDetails;
    }
    
    // throws UnsupportedTxnError
    private tryGetStrategyByType(transactionType: TransactionType): AbstractPaymentDetailsStrategy<PaymentDetails> {  
        if (TransactionTypeExtensions.isCardOperation(transactionType)) {
            return this.cardOperationStrategy;
        } else if (TransactionTypeExtensions.isCrossBorderTransfer(transactionType)) {
            return this.crossBorderTransferStrategy;
        } else if (TransactionTypeExtensions.isCrossBorderTransferFee(transactionType)) {
            return this.crossBorderTransferFeeStrategy;
        } else if (TransactionTypeExtensions.isDeskWithdrawal(transactionType)) {
            return this.deskWithdrawalStrategy;
        } else if (TransactionTypeExtensions.isStandardFee(transactionType)) {
            return this.standardFeeStrategy;
        } else if (TransactionTypeExtensions.isStandardTransfer(transactionType)) {
            return this.standardTransferStrategy;
        } else {
            throw new UnsupportedTxnError(transactionType);
        }
    }
}