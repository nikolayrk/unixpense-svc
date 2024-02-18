import Transaction from '../types/transaction';
import { default as TransactionModel } from '../models/transaction.model';
import PaymentDetails from "../types/paymentDetails";
import '../extensions/globalExtensions';
import { injectable } from 'inversify';
import RepositoryError from '../../core/errors/repositoryError';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';
import TransactionType from '../enums/transactionType';
import EntryType from '../enums/entryType';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

@injectable()
export default class TransactionRepository {
    public getAllIdsAsync = async () =>
        TransactionModel
            .findAll({ attributes: ['id'] })
            .then(r =>
                r.map(e => e.id));

    public async getAsync(
        fromDate: Date,
        toDate: Date,
        types: TransactionType[],
        entryTypes: EntryType[],
        fromSum: number | null,
        toSum: number | null,
        recipient: string | null,
        description: string | null
    ) {
        const entities = await this.queryAsync(fromDate, toDate, types, entryTypes, fromSum, toSum);

        const recipientEntities = recipient !== null
            ? await this.searchByRecipientAsync(recipient)
            : null;
        const descriptionEntities = description !== null
            ? await this.searchByDescriptionAsync(description)
            : null;
        const filteredRecipientAndDescriptionEntities = recipientEntities === null || descriptionEntities == null
            ? null
            : entities
                .filter(e => recipientEntities
                    .map(r => r.id)
                    .concat(descriptionEntities
                        .map(r => r.id))
                    .includes(e.id));
        const filteredRecipientEntities = recipientEntities === null
            ? null
            : recipientEntities
                .filter(e => recipientEntities
                    .map(r => r.id)
                    .includes(e.id));
        const filteredDescriptionEntities = descriptionEntities === null
            ? null
            : descriptionEntities
                .filter(e => descriptionEntities
                    .map(r => r.id)
                    .includes(e.id));
        const filteredEntities = filteredRecipientAndDescriptionEntities !== null
            ? filteredRecipientAndDescriptionEntities
            : filteredRecipientEntities !== null
                ? filteredRecipientEntities
                : filteredDescriptionEntities !== null
                        ? filteredDescriptionEntities
                        : entities;

        return filteredEntities
            .map(TransactionExtensions.trimEntity)
            .map(TransactionExtensions.toModel);
    }

    // throws RepositoryError
    public async bulkCreateAsync(transactions: Transaction<PaymentDetails>[]) {
        const mapped = transactions.map(TransactionExtensions.toRecord);
        
        try {
            const created = await TransactionModel.bulkCreate(mapped, {
                include: [
                    TransactionModel.associations['card_operation'],
                    TransactionModel.associations['standard_transfer'],
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

    private async queryAsync(
        fromDate: Date,
        toDate: Date,
        types: TransactionType[],
        entryTypes: EntryType[],
        fromSum: number | null,
        toSum: number | null
    ) {
        const entities = await TransactionModel.findAll({
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
                TransactionModel.associations['card_operation'],
                TransactionModel.associations['standard_transfer'],
            ]
        });

        return entities;
    }

    private async searchByRecipientAsync(recipient: string) {
        const cardOperationEntities = await this.fullTextSearchAsync('card_operation.recipient', recipient);

        const standardTransferEntities = await this.fullTextSearchAsync('standard_transfer.recipient', recipient);

        return [
            ...cardOperationEntities,
            ...standardTransferEntities
        ];
    }

    private async searchByDescriptionAsync(description: string) {
        const cardOperationEntities = await this.fullTextSearchAsync('card_operation.instrument', description);

        const standardTransferEntities = await this.fullTextSearchAsync('standard_transfer.description', description);

        return [
            ...cardOperationEntities,
            ...standardTransferEntities
        ];
    }

    private async fullTextSearchAsync(columnName: string, value: string) {
        const result = await TransactionModel.findAll({
            where: Sequelize.literal(
                `MATCH(${columnName}) AGAINST('${value}' IN BOOLEAN MODE)`
            ),
            include: [
                TransactionModel.associations['card_operation'],
                TransactionModel.associations['standard_transfer'],
            ]
        });

        return result;
    }
}