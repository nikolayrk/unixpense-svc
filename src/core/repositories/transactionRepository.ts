import Transaction from '../../core/models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../../core/models/paymentDetails";
import '../extensions/globalExtensions';
import { injectable } from 'inversify';
import RepositoryError from '../../core/errors/repositoryError';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';
import TransactionType from '../enums/transactionType';
import EntryType from '../enums/entryType';
import { Op } from 'sequelize';

@injectable()
export default class TransactionRepository {
    public getAllIdsAsync = async () => (await TransactionEntity.findAll({attributes: ['id']})).map(e => e.id);

    public async getAsync(fromDate: Date, toDate: Date, types: TransactionType[], entryTypes: EntryType[], fromSum: number | null, toSum: number | null) {
        const entities: TransactionEntity[] = await TransactionEntity.findAll({
            where: {
                value_date: {
                    [Op.between]: [fromDate.toSqlDate(), toDate.toSqlDate()]
                },
                ...(fromSum !== null || toSum !== null) && {
                    sum: {
                        ...(fromSum !== null) && {
                            [Op.gte]: fromSum,
                        },
                        ...(toSum !== null) && {
                            [Op.lte]: toSum
                        }
                    },
                },
                ...(types.length > 0) && {
                    type: {
                        [Op.in]: types
                    },
                },
                ...(entryTypes.length > 0) && {
                    entry_type: { 
                        [Op.in]: entryTypes
                    }
                }
            },
            include: [
                TransactionEntity.associations['card_operation'],
                TransactionEntity.associations['standard_transfer'],
            ]
        });

        return entities
            .map(TransactionExtensions.trimEntity)
            .map(TransactionExtensions.toModel);
    }

    // throws RepositoryError
    public async bulkCreateAsync(transactions: Transaction<PaymentDetails>[]) {
        const mapped = transactions.map(TransactionExtensions.toRecord);
        
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