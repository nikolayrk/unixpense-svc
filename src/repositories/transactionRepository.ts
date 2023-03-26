import Transaction from '../models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../models/paymentDetails";
import '../extensions/dateExtensions';
import { EntryTypeExtensions } from "../extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import ITransactionRepository from '../contracts/ITransactionRepository';
import { injectable } from 'inversify';
import CardOperation from '../models/cardOperation';
import CrossBorderTransfer from '../models/crossBorderTransfer';
import StandardFee from '../models/standardFee';
import StandardTransfer from '../models/standardTransfer';

@injectable()
export default class TransactionRepository implements ITransactionRepository {
    public async createAsync(transaction: Transaction<PaymentDetails>) {
        const constructCardOperation = (paymentDetails: CardOperation) => {
            return {
                beneficiary: paymentDetails.beneficiary,
                currency: paymentDetails.currency,
                instrument: paymentDetails.instrument,
                sum: paymentDetails.sum
            };
        };
        
        const constructCrossBorderTransfer = (paymentDetails: CrossBorderTransfer) => {
            return {
                beneficiary: paymentDetails.beneficiary,
                iban: paymentDetails.iban,
                description: paymentDetails.description
            };
        };
        
        const constructStandardFee = (paymentDetails: StandardFee) => {
            return {
                beneficiary: paymentDetails.beneficiary,
                description: paymentDetails.description
            };
        };
        
        const constructStandardTransfer = (paymentDetails: StandardTransfer) => {
            return {
                beneficiary: paymentDetails.beneficiary,
                iban: paymentDetails.iban,
                description: paymentDetails.description
            };
        };

        await TransactionEntity.create({
                message_id: transaction.messageId,
                date: transaction.date.toSqlDate(),
                reference: transaction.reference,
                value_date: transaction.valueDate.toSqlDate(),
                sum: transaction.sum,
                entry_type: EntryTypeExtensions.ToString(transaction.entryType),
                type: TransactionTypeExtensions.ToString(transaction.type),

                ...TransactionTypeExtensions.IsCardOperation(transaction.type) && {
                    card_operation: constructCardOperation(transaction.paymentDetails as CardOperation)
                },
                
                ...TransactionTypeExtensions.IsCrossBorderTransfer(transaction.type) && {
                    cross_border_transfer: constructCrossBorderTransfer(transaction.paymentDetails as CrossBorderTransfer)
                },

                ...TransactionTypeExtensions.IsStandardFee(transaction.type) && {
                    standard_fee: constructStandardFee(transaction.paymentDetails as StandardFee)
                },

                ...TransactionTypeExtensions.IsStandardTransfer(transaction.type) && {
                    standard_transfer: constructStandardTransfer(transaction.paymentDetails as StandardTransfer)
                },
        }, {
            include: [
                TransactionEntity.associations['card_operation'],
                TransactionEntity.associations['cross_border_transfer'],
                TransactionEntity.associations['standard_fee'],
                TransactionEntity.associations['standard_transfer'],
            ]
        });
    }

    public async existsAsync(messageId: string) {
        const foundTransaction = await TransactionEntity
            .findOne({
                where: {
                    message_id: messageId
                }
            });

        return foundTransaction !== null;
    }
}