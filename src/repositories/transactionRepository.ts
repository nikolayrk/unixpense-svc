import Transaction from '../models/transaction';
import TransactionEntity from '../entities/transaction.entity';
import PaymentDetails from "../models/paymentDetails";
import '../extensions/dateExtensions';
import { EntryTypeExtensions } from "../extensions/entryTypeExtensions";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import PaymentDetailsRepository from './paymentDetailsRepository';
import TransactionType from '../enums/transactionType';

export default class TransactionRepository {
    private readonly paymentDetailsRepository: PaymentDetailsRepository;

    constructor(paymentDetailsRepository: PaymentDetailsRepository) {
        this.paymentDetailsRepository = paymentDetailsRepository;
    }

    public async createAsync(transaction: Transaction<PaymentDetails>) {
        const [_, created] = await TransactionEntity.findOrCreate({
            where: {
                message_id: transaction.messageId,
                date: transaction.date.toSqlDate(),
                reference: transaction.reference,
                value_date: transaction.valueDate.toSqlDate(),
                sum: transaction.sum,
                entry_type: EntryTypeExtensions.ToString(transaction.entryType),
                type: TransactionTypeExtensions.ToString(transaction.type),
            }
        });

        if (!created) {
            console.log(`Message with ID ${transaction.messageId} already exists. Skipping...`);
            
            return created;
        }
    
        if (transaction.type !== TransactionType.UNKNOWN) {
            await this.paymentDetailsRepository.createAsync(transaction.messageId, transaction.type, transaction.paymentDetails);
        }
        
        console.log(`Successfully added transaction with reference ${transaction.reference} of type ${TransactionTypeExtensions.ToString(transaction.type)} to database`);

        return created;
    }

    public async findOrNullAsync(message_id: string) {
        const foundTransaction = await TransactionEntity
            .findOne({
                where: {
                    message_id: message_id
                }
            });

        return foundTransaction;
    }
}