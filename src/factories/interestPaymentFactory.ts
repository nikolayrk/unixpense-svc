import { Node } from "node-html-parser";
import InterestPayment from "../models/interestPayment";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";

export default class InterestPaymentFactory implements PaymentDetailsFactory<InterestPayment> {
    create(transactionDetails: Node[]): InterestPayment {
        const paymentDetails = transactionDetails[0]
            .childNodes
            .slice(1)
            .map((c) => c.rawText)
            .join('');

        const iban = transactionDetails[2]
            .childNodes[1]
            .childNodes[1]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const beneficiary = transactionDetails[2]
            .childNodes[1]
            .childNodes[3]
            .childNodes[1]
            .childNodes[0]
           ?.rawText;

        const transaction: InterestPayment = {
            beneficiary: beneficiary,
            iban: iban,
            details: paymentDetails,
        };

        return transaction;
    }
}