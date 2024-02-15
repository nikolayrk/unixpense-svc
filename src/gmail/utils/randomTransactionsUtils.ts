import ITransactionProvider from "../../core/contracts/ITransactionProvider";
import PaymentDetails from "../../core/types/paymentDetails";
import Transaction from "../../core/types/transaction";
import { paymentDetailsTestCases } from "../types/paymentDetailsTestCases";

const durstenfeldShuffle = <T>(array: T[]) => {
    const result = array.slice(0);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

const resolveTransactionIds = () => {
    return Object.keys(paymentDetailsTestCases).filter(k => isNaN(Number(k)));
}

const randomiseTransactionIds = (transactionIds: string[]) => {
    const randomizedTransactionIds = durstenfeldShuffle(transactionIds);
    
    return randomizedTransactionIds;
};

const resolveRandomNumberOfTransactionIds = (transactionIds: string[]) => {
    const size = Math.random() * (transactionIds.length - 1) + 1;

    return transactionIds.slice(0, size);
}

const resolveTransactionsAsync = async (transactionProvider: ITransactionProvider, transactionIds: string[]) => {
    const transactions = transactionIds
        .map((transactionId: string) => {
            const transaction = transactionProvider.resolveTransactionAsync(transactionId);
            
            return transaction;
        })
        .reduce(async (accumulator, current, i) => {
            const currentValue = await current;
            
            const accumulatorValue = await accumulator;

            accumulatorValue.push(currentValue);

            return accumulator;
        }, Promise.resolve([] as Transaction<PaymentDetails>[]));

    return transactions;
};

export {
    resolveTransactionIds,
    randomiseTransactionIds,
    resolveRandomNumberOfTransactionIds,
    resolveTransactionsAsync
}