import { Node } from "node-html-parser";
import StandardTransfer from "../models/standardTransfer";
import { IPaymentDetailsFactory } from "../contracts/IPaymentDetailsFactory";
import '../extensions/stringExtensions';
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";
import { injectable } from "inversify";

@injectable()
export default class StandardTransferFactory implements IPaymentDetailsFactory<StandardTransfer> {
    public tryCreate(transactionReference: string, transactionDetailsNodes: Node[], additionalTransactionDetailsNode?: Node): StandardTransfer {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('');

        if (additionalTransactionDetailsNode === undefined) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to read additional payment details`);
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

        const paymentDetails: StandardTransfer = {
            beneficiary: beneficiary,
            iban: iban,
            description: transactionDetailsRaw,
        };

        return paymentDetails;
    }
}