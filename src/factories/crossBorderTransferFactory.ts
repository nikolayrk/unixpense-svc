import { Node } from "node-html-parser";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";
import '../extensions/cleanPaymentDetails';

export default class CrossBorderTransferFactory implements PaymentDetailsFactory<CrossBorderTransfer> {
    public create(transactionDetails: Node[]): CrossBorderTransfer {
        const paymentDetailsRaw = transactionDetails[0]
            .childNodes
            .map(c => c.rawText.cleanTransactionDetails())
            .reverse()
            .join('')

        const regex = /(?:AZV-)?(\w[^,]+)/g;
        const matches = [...paymentDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const beneficiary = paymentDetails[0];
        const description = paymentDetails[3];
        const iban = paymentDetails[7];

        if (beneficiary === undefined || description === undefined || iban === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${paymentDetailsRaw}'`);
        }

        const transaction: CrossBorderTransfer = {
            beneficiary: beneficiary,
            iban: iban,
            description: description
        }

        return transaction;
    }
}