import ITransactionProvider from "../contracts/ITransactionProvider";
import PaymentDetails from "../types/paymentDetails";
import { PaymentDetailsTestCase, PaymentDetailsTestCaseData } from "../types/paymentDetailsTestCase";
import Transaction from "../types/transaction";

export default class TransactionTestHelper {
    private ids: string[];

    constructor(testCases: PaymentDetailsTestCase<PaymentDetailsTestCaseData>) {
        this.ids = Object
            .keys(testCases)
            .filter(k => isNaN(Number(k)));
    }

    public randomise() {
        this.ids = this.durstenfeldShuffle(this.ids);

        return this;
    }

    public randomCount() {
        const max = this.ids.length;
        const min = this.ids.length / 2;
        const size = Math.random() * (max - min) + min;

        this.ids = this.ids.slice(0, size);

        return this;
    }

    public resolveTransactionIds() {
        return this.ids;
    }

    public async resolveTransactionsAsync(transactionProvider: ITransactionProvider) {
        const transactions = this.ids
            .map((transactionId: string) => {
                const transactionPromise = transactionProvider.resolveTransactionAsync(transactionId);
                
                return transactionPromise;
            })
            .reduce(async (accumulator, current, i) => {
                const currentValue = await current;

                const accumulatorValue = await accumulator;

                accumulatorValue.push(currentValue);

                return accumulator;
            }, Promise.resolve([] as Transaction<PaymentDetails>[]));

        return transactions;
    }

    private durstenfeldShuffle<T>(array: Array<T>) {
        const result = array.slice(0);

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }
}
