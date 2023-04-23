import Transaction from '../../shared/models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../../shared/models/paymentDetails";
import '../../shared/extensions/dateExtensions';
import { EntryTypeExtensions } from "../../shared/extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../../shared/extensions/transactionTypeExtensions";
import { inject, injectable } from 'inversify';
import { DatabaseError, ValidationError } from 'sequelize';
import RepositoryError from '../../shared/errors/repositoryError';

@injectable()
export default class TransactionRepository {
    // throws RepositoryError
    public async tryCreateAsync(transaction: Transaction<PaymentDetails>) {
        try {
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

                    ...TransactionTypeExtensions.IsStandardTransfer(transaction.type) && {
                        standard_transfer: transaction.paymentDetails
                    },
                    
                    ...TransactionTypeExtensions.IsCrossBorderTransfer(transaction.type) && {
                        standard_transfer: transaction.paymentDetails
                    },
                    
                    ...TransactionTypeExtensions.IsDeskWithdrawal(transaction.type) && {
                        standard_transfer: transaction.paymentDetails
                    },

                    ...TransactionTypeExtensions.IsStandardFee(transaction.type) && {
                        standard_transfer: transaction.paymentDetails
                    },
            }, {
                include: [
                    TransactionEntity.associations['card_operation'],
                    TransactionEntity.associations['standard_transfer'],
                ]
            });
        } catch(ex) {
            // Wrap the passed db error and strip db transaction data, as not to log sensitive information
            if (ex instanceof ValidationError || ex instanceof DatabaseError) {
                throw new RepositoryError(ex);
            }

            throw ex;
        }
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