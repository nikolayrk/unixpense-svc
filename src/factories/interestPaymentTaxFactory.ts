import { Node } from "node-html-parser";
import InterestPaymentTax from "../models/interestPaymentTax";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";

export default class InterestPaymentTaxFactory implements PaymentDetailsFactory<InterestPaymentTax> {
    create(transactionDetails: Node[]): InterestPaymentTax {
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

        const transaction: InterestPaymentTax = {
            beneficiary: beneficiary,
            iban: iban,
            details: paymentDetails,
        };

        return transaction;
    }
}