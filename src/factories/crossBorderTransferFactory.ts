import { Node } from "node-html-parser";
import { IPaymentDetailsFactory } from "../contracts/IPaymentDetailsFactory";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";
import '../extensions/stringExtensions';
import { injectable } from "inversify";

@injectable()
export default class CrossBorderTransferFactory implements IPaymentDetailsFactory<CrossBorderTransfer> {
    public tryCreate(transactionReference: string, transactionDetailsNodes: Node[]): CrossBorderTransfer {
        const transactionDetailsRaw = transactionDetailsNodes
            .map(c => c.rawText.cleanTransactionDetails())
            .reverse()
            .join('')

        const regex = /(?:AZV-)?(\w[^,]+)/g;
        const matches = [...transactionDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const beneficiary = paymentDetails[0];
        const description = paymentDetails[3];
        const iban = paymentDetails[7];

        if (beneficiary === undefined || description === undefined || iban === undefined) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        const transaction: CrossBorderTransfer = {
            beneficiary: beneficiary,
            iban: iban,
            description: description
        }

        return transaction;
    }
}