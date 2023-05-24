import Transaction from '../../shared/models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../../shared/models/paymentDetails";
import '../../shared/extensions/dateExtensions';
import { injectable } from 'inversify';
import RepositoryError from '../../shared/errors/repositoryError';
import { TransactionExtensions } from '../../shared/extensions/transactionExtensions';

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