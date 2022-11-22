import { Node } from "node-html-parser";
import StandardTransfer from "../models/standardTransfer";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import '../extensions/stringExtensions';

export default class StandardTransferFactory implements PaymentDetailsFactory<StandardTransfer> {
    public create(transactionDetails: Node[]): StandardTransfer {
        const paymentDetails = transactionDetails[0]
            .childNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

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

        const transaction: StandardTransfer = {
            beneficiary: beneficiary,
            iban: iban,
            description: paymentDetails,
        };

        return transaction;
    }
}