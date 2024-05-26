import GmailTransactionTestHelper from "../../gmail/utils/gmailTransactionTestHelper";
import { PaymentDetailsTestCase, PaymentDetailsTestCaseData } from "../types/paymentDetailsTestCase";

export default class TransactionTestHelper {
    private ids: string[] = [];
    private gmailTransactionTestHelper: GmailTransactionTestHelper | undefined;

    public withTestCases(testCases: PaymentDetailsTestCase<PaymentDetailsTestCaseData>) {
        this.ids = Object
            .keys(testCases)
            .filter(k => isNaN(Number(k)));

        return this;
    }

    public useGmailContext() {
        if (!this.gmailTransactionTestHelper) {
            this.gmailTransactionTestHelper = new GmailTransactionTestHelper();
        }

        return this.gmailTransactionTestHelper;
    }

    public randomise() {
        this.ids = this.durstenfeldShuffle(this.ids);

        return this;
    }

    public randomCount(small: boolean = false) {
        const max = !small ? this.ids.length : this.ids.length / 2;
        const min = !small ? this.ids.length / 2 : this.ids.length / 4;
        const size = Math.random() * (max - min) + min;

        this.ids = this.ids.slice(0, size);

        return this;
    }

    public resolveTransactionIds(from?: string, to?: string) {
        return from !== undefined && to !== undefined
            ? this.ids.slice(this.ids.indexOf(from)+1, this.ids.indexOf(to)+1)
            : from !== undefined && to === undefined
                ? this.ids.slice(this.ids.indexOf(from)+1)
                : from === undefined && to !== undefined
                    ? this.ids.slice(0, this.ids.indexOf(to)+1)
                    : this.ids;
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
