import { Node } from "node-html-parser";
import StandardTransfer from "../models/standardTransfer";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import '../extensions/stringExtensions';
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";

export default class StandardTransferFactory implements PaymentDetailsFactory<StandardTransfer> {
    public create(transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node): StandardTransfer {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

        if (additionalTransactionDetailsNode === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to read additional payment details`);
        }

        const iban = additionalTransactionDetailsNode
            .childNodes[1]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const beneficiary = additionalTransactionDetailsNode
            .childNodes[3]
            .childNodes[1]
            .childNodes[0]
           ?.rawText;

        const transaction: StandardTransfer = {
            beneficiary: beneficiary,
            iban: iban,
            description: transactionDetailsRaw,
        };

        return transaction;
    }
}