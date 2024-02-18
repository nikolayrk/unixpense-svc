import seedrandom from "seedrandom";
import ITransactionProvider from "../contracts/ITransactionProvider";
import PaymentDetails from "../types/paymentDetails";
import { PaymentDetailsTestCase, PaymentDetailsTestCaseData } from "../types/paymentDetailsTestCase";
import Transaction from "../types/transaction";

const generateTransactionReference = (seed: string) => {
    const rng = seedrandom(seed);
    const random = Math.floor(rng() * Math.pow(10, 17));
    const reference = random
        .toString(16)
        .toUpperCase();

    return reference;
}

const durstenfeldShuffle = <T>(array: Array<T>) => {
    const result = array.slice(0);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

const resolveTransactionIds = <T extends PaymentDetailsTestCaseData>(
    paymentDetailsTestCases: PaymentDetailsTestCase<T>
) => Object
        .keys(paymentDetailsTestCases)
        .filter(k => isNaN(Number(k)));

const randomiseTransactionIds = (transactionIds: string[]) => {
    const randomizedTransactionIds = durstenfeldShuffle(transactionIds);
    
    return randomizedTransactionIds;
};

const resolveRandomNumberOfTransactionIds = (transactionIds: string[]) => {
    const max = transactionIds.length;
    const min = transactionIds.length / 2;
    const size = Math.random() * (max - min) + min;

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
    generateTransactionReference,
    resolveTransactionIds,
    randomiseTransactionIds,
    resolveRandomNumberOfTransactionIds,
    resolveTransactionsAsync
}