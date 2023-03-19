import Transaction from '../models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../models/paymentDetails";
import '../extensions/dateExtensions';
import { EntryTypeExtensions } from "../extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import CardOperationEntity from '../entities/cardOperation.entity';
import CrossBorderTransferEntity from '../entities/crossBorderTransfer.entity';
import StandardFeeEntity from '../entities/standardFee.entity';
import StandardTransferEntity from '../entities/standardTransfer.entity';

export default class TransactionRepository {
    public async createAsync(transaction: Transaction<PaymentDetails>) {
        await TransactionEntity.create({
            message_id: transaction.messageId,
            date: transaction.date.toSqlDate(),
            reference: transaction.reference,
            value_date: transaction.valueDate.toSqlDate(),
            sum: transaction.sum,
            entry_type: EntryTypeExtensions.ToString(transaction.entryType),
            type: TransactionTypeExtensions.ToString(transaction.type),
        });
    }

    public async findOrNullAsync(message_id: string) {
        const foundTransaction = await TransactionEntity
            .findOne({
                include: [
                    CardOperationEntity,
                    CrossBorderTransferEntity,
                    StandardFeeEntity,
                    StandardTransferEntity],
                where: {
                    message_id: message_id
                }
            });

        return foundTransaction;
    }
}