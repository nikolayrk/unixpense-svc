import { Node } from "node-html-parser";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import PeriodicFee from "../models/periodicFee";

export default class PeriodicFeeFactory implements PaymentDetailsFactory<PeriodicFee> {
    create(transactionDetails: Node[]): PeriodicFee {
        const paymentDetails = transactionDetails[0]
            .childNodes
            .slice(1)
            .map((c) => c.rawText)
            .join('');

        const transaction: PeriodicFee = {
            beneficiary: '',
            details: paymentDetails,
        }

        return transaction;
    }
}