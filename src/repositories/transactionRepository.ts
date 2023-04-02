import Transaction from '../models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../models/paymentDetails";
import '../extensions/dateExtensions';
import { EntryTypeExtensions } from "../extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import ITransactionRepository from '../contracts/ITransactionRepository';
import { injectable } from 'inversify';

@injectable()
export default class TransactionRepository implements ITransactionRepository {
    public async createAsync(transaction: Transaction<PaymentDetails>) {
        await TransactionEntity.create({
                id: transaction.id,
                date: transaction.date.toSqlDate(),
                reference: transaction.reference,
                value_date: transaction.valueDate.toSqlDate(),
                sum: transaction.sum,
                entry_type: EntryTypeExtensions.ToString(transaction.entryType),
                type: TransactionTypeExtensions.ToString(transaction.type),

                ...TransactionTypeExtensions.IsCardOperation(transaction.type) && {
                    card_operation: transaction.paymentDetails
                },
                
                ...TransactionTypeExtensions.IsCrossBorderTransfer(transaction.type) && {
                    cross_border_transfer: transaction.paymentDetails
                },
                
                ...TransactionTypeExtensions.IsDeskWithdrawal(transaction.type) && {
                    desk_withdrawal: transaction.paymentDetails
                },

                ...TransactionTypeExtensions.IsStandardFee(transaction.type) && {
                    standard_fee: transaction.paymentDetails
                },

                ...TransactionTypeExtensions.IsStandardTransfer(transaction.type) && {
                    standard_transfer: transaction.paymentDetails
                },
        }, {
            include: [
                TransactionEntity.associations['card_operation'],
                TransactionEntity.associations['cross_border_transfer'],
                TransactionEntity.associations['desk_withdrawal'],
                TransactionEntity.associations['standard_fee'],
                TransactionEntity.associations['standard_transfer'],
            ]
        });
    }

    public async existsAsync(transactionId: string) {
        const foundTransaction = await TransactionEntity
            .findOne({
                where: {
                    id: transactionId
                }
            });

        return foundTransaction !== null;
    }
}