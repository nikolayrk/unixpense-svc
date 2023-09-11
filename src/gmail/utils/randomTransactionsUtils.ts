import ITransactionProvider from "../../core/contracts/ITransactionProvider";
import PaymentDetails from "../../core/models/paymentDetails";
import Transaction from "../../core/models/transaction";
import { paymentDetailsTestCases } from "../types/paymentDetailsTestCases";

const resolveRandomTransactionIds = () => {
    const allTransactionIds = Object.keys(paymentDetailsTestCases).filter(k => isNaN(Number(k)));
    const count = Math.random() * (allTransactionIds.length - 1) + 1;
    const transactionIds = allTransactionIds.splice(0, count);
    
    return transactionIds;
};

const resolveRandomTransactionsAsync = async (transactionProvider: ITransactionProvider) => {    
    const transactionIds = resolveRandomTransactionIds();

    const transactions = transactionIds
        .map((transactionId: string) => {
            const transaction = transactionProvider.resolveTransactionAsync(transactionId);
            
            return transaction;
        })
        .reduce(async (accumulator, current, i) => {
            const currentValue = await current;

            if (currentValue === null) {
                return accumulator;
            }
            
            const accumulatorValue = await accumulator;

            accumulatorValue.push(currentValue);

            return accumulator;
        }, Promise.resolve([] as Transaction<PaymentDetails>[]));

    return transactions;
};

export { 
    resolveRandomTransactionIds,
    resolveRandomTransactionsAsync
}