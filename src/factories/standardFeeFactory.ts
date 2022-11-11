import { Node } from "node-html-parser";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import StandardFee from "../models/standardFee";

export default class StandardFeeFactory implements PaymentDetailsFactory<StandardFee> {
    private readonly type: string;
    
    public constructor(type: string) {
        this.type = type;
    }

    public create(transactionDetails: Node[]): StandardFee {
        const paymentDetails = transactionDetails[0]
            .childNodes
            .slice(1)
            .map((c) => c.rawText)
            .join('')
            .replace(this.type, '')
            .replace(/\/+$/, '')
            .trim();

        const transaction: StandardFee = {
            type: this.type,
            beneficiary: 'UNICREDIT BULBANK',
            description: paymentDetails,
        }

        return transaction;
    }
}