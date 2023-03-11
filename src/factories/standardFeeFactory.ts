import { Node } from "node-html-parser";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import StandardFee from "../models/standardFee";
import '../extensions/stringExtensions';

export default class StandardFeeFactory implements PaymentDetailsFactory<StandardFee> {
    public create(transactionDetailsNodes: Node[]): StandardFee {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

        const transaction: StandardFee = {
            beneficiary: 'UNICREDIT BULBANK',
            description: transactionDetailsRaw,
        }

        return transaction;
    }
}