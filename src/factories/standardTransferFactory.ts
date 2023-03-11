import { Node } from "node-html-parser";
import StandardTransfer from "../models/standardTransfer";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import '../extensions/stringExtensions';

export default class StandardTransferFactory implements PaymentDetailsFactory<StandardTransfer> {
    public create(transactionDetailsNodes: Node[]): StandardTransfer {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

        const iban = transactionDetailsNodes[2]
            .childNodes[1]
            .childNodes[1]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const beneficiary = transactionDetailsNodes[2]
            .childNodes[1]
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