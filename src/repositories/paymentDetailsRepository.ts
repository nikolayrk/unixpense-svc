import PaymentDetails from "../models/paymentDetails";
import StandardTransfer from "../models/standardTransfer";
import StandardFee from "../models/standardFee";
import CardOperation from "../models/cardOperation";
import TransactionType from "../enums/transactionType";
import CardOperationEntity from "../entities/cardOperation.entity";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import UnsupportedTxnError from "../errors/unsupportedTxnError";
import CrossBorderTransferEntity from "../entities/crossBorderTransfer.entity";
import StandardTransferEntity from "../entities/standardTransfer.entity";
import StandardFeeEntity from "../entities/standardFee.entity";

export default class PaymentDetailsRepository {
    public async createAsync(messageId: string, transactionType: TransactionType, paymentDetails: PaymentDetails) {
        switch (transactionType) {
            case TransactionType.CARD_OPERATION:
                await this.createCardOperationAsync(paymentDetails as CardOperation, messageId);
                break;
            
            case TransactionType.CROSS_BORDER_TRANSFER:
                await this.createCrossBorderTransferAsync(paymentDetails as CrossBorderTransfer, messageId);
                break;
            
            case TransactionType.PERIODIC_FEE:
            case TransactionType.INTERBANK_TRANSFER_FEE:
            case TransactionType.TRANSFER_FEE:
            case TransactionType.CROSS_BORDER_TRANSFER_FEE:
            case TransactionType.INTERNAL_TRANSFER_FEE:
            case TransactionType.WITHDRAWAL_FEE:
            case TransactionType.DESK_WITHDRAWAL_FEE:
                await this.createStandardFeeAsync(paymentDetails as StandardFee, messageId);
                break;
                
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
                await this.createStandardTransferAsync(paymentDetails as StandardTransfer, messageId);
                break;

            default:
                throw new UnsupportedTxnError('Unsupported transaction type');
        }
    }

    private async createStandardTransferAsync(paymentDetails: StandardTransfer, messageId: string) {
        await StandardTransferEntity.create({
            message_id: messageId,
            beneficiary: paymentDetails.beneficiary,
            iban: paymentDetails.iban,
            description: paymentDetails.description
        });
    }

    private async createStandardFeeAsync(paymentDetails: StandardFee, messageId: string) {
        await StandardFeeEntity.create({
            message_id: messageId,
            beneficiary: paymentDetails.beneficiary,
            description: paymentDetails.description
        });
    }

    private async createCrossBorderTransferAsync(paymentDetails: CrossBorderTransfer, messageId: string) {
        await CrossBorderTransferEntity.create({
            message_id: messageId,
            beneficiary: paymentDetails.beneficiary,
            iban: paymentDetails.iban,
            description: paymentDetails.description
        });
    }

    private async createCardOperationAsync(paymentDetails: CardOperation, messageId: string) {
        await CardOperationEntity.create({
            message_id: messageId,
            beneficiary: paymentDetails.beneficiary,
            instrument: paymentDetails.instrument,
            sum: paymentDetails.sum,
            currency: paymentDetails.currency
        });
    }
}