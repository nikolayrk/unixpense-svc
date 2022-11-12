import { Node } from "node-html-parser";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import StandardFee from "../models/standardFee";
import '../extensions/cleanPaymentDetails';

export default class StandardFeeFactory implements PaymentDetailsFactory<StandardFee> {
    public create(transactionDetails: Node[]): StandardFee {
        const paymentDetails = transactionDetails[0]
            .childNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

        const transaction: StandardFee = {
            beneficiary: 'UNICREDIT BULBANK',
            description: paymentDetails,
        }

        return transaction;
    }
}