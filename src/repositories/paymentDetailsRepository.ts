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
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";

export default class PaymentDetailsRepository {
    public async createAsync(messageId: string, transactionType: TransactionType, paymentDetails: PaymentDetails) {
        if (TransactionTypeExtensions.IsCardOperation(transactionType)) {
            await this.createCardOperationAsync(paymentDetails as CardOperation, messageId);
        } else if (TransactionTypeExtensions.IsCrossBorderTransfer(transactionType)) {
            await this.createCrossBorderTransferAsync(paymentDetails as CrossBorderTransfer, messageId);
        } else if (TransactionTypeExtensions.IsStandardFee(transactionType)) {
            await this.createStandardFeeAsync(paymentDetails as StandardFee, messageId);
        } else if (TransactionTypeExtensions.IsStandardTransfer(transactionType)) {
            await this.createStandardTransferAsync(paymentDetails as StandardTransfer, messageId);
        } else {
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