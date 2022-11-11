import { Node } from "node-html-parser";
import InternalTransferPayroll from "../models/internalTransferPayroll";
import PaymentDetailsFactory from "../models/paymentDetailsFactory";

export default class InternalTransferPayrollFactory implements PaymentDetailsFactory<InternalTransferPayroll> {
    create(transactionDetails: Node[]): InternalTransferPayroll {
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

        const transaction: InternalTransferPayroll = {
            beneficiary: beneficiary,
            iban: iban,
            details: paymentDetails,
        };

        return transaction;
    }
}