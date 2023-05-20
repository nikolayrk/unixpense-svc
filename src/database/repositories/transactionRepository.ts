import Transaction from '../../shared/models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../../shared/models/paymentDetails";
import '../../shared/extensions/dateExtensions';
import { EntryTypeExtensions } from "../../shared/extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../../shared/extensions/transactionTypeExtensions";
import { injectable } from 'inversify';
import RepositoryError from '../../shared/errors/repositoryError';
import StandardTransfer from '../../shared/models/standardTransfer';

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

                    ...(TransactionTypeExtensions.IsCrossBorderTransfer(transaction.type) ||
                        TransactionTypeExtensions.IsCrossBorderTransferFee(transaction.type) ||
                        TransactionTypeExtensions.IsDeskWithdrawal(transaction.type) ||
                        TransactionTypeExtensions.IsStandardFee(transaction.type) ||
                        TransactionTypeExtensions.IsStandardTransfer(transaction.type)) && {
                        standard_transfer: TransactionTypeExtensions.MapStandardTransfer(transaction.paymentDetails as StandardTransfer)
                    },
            }, {
                include: [
                    TransactionEntity.associations['card_operation'],
                    TransactionEntity.associations['standard_transfer'],
                ]
            });
        } catch(ex) {
            // Wrap all thrown db errors and strip of possible sensitive information
            if (ex instanceof Error) {
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