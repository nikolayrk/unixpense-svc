import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import TransactionRepository from "../repositories/transactionRepository";
import PaymentDetailsRepository from "../repositories/paymentDetailsRepository";
import { TransactionTypeExtensions } from "../extensions/transactionTypeExtensions";
import TransactionType from "../enums/transactionType";

export default async function addTransactionToDatabase(
    transaction: Transaction<PaymentDetails>,
    transactionRepository: TransactionRepository,
    paymentDetailsRepository: PaymentDetailsRepository) {
    await transactionRepository.createAsync(transaction);

    if (transaction.type !== TransactionType.UNKNOWN) {
        await paymentDetailsRepository.createAsync(transaction.messageId, transaction.type, transaction.paymentDetails);
    }

    console.log(`Successfully added transaction with reference ${transaction.reference} of type ${TransactionTypeExtensions.ToString(transaction.type)} to database`);
}
