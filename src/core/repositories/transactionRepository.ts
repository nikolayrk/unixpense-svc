import Transaction from '../../core/models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../../core/models/paymentDetails";
import '../../core/extensions/dateExtensions';
import { injectable } from 'inversify';
import RepositoryError from '../../core/errors/repositoryError';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';

@injectable()
export default class TransactionRepository {
    public async getAllIdsAsync() {
        return (await TransactionEntity.findAll({attributes: ['id']})).map(e => e.id);
    }

    // throws RepositoryError
    public async tryBulkCreate(transactions: Transaction<PaymentDetails>[]) {
        const mapped = transactions.map(TransactionExtensions.MapTransaction);
        
        try {
            const created = await TransactionEntity.bulkCreate(mapped, {
                include: [
                    TransactionEntity.associations['card_operation'],
                    TransactionEntity.associations['standard_transfer'],
                ]
            });

            return created.length;
        } catch(ex) {
            // Wrap all thrown db errors and strip of possible sensitive information
            if (ex instanceof Error) {
                throw new RepositoryError(ex);
            }

            throw ex;
        }
    }
}