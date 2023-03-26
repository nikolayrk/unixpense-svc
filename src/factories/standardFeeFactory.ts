import { Node } from "node-html-parser";
import { IPaymentDetailsFactory } from "../contracts/IPaymentDetailsFactory";
import StandardFee from "../models/standardFee";
import '../extensions/stringExtensions';
import { injectable } from "inversify";

@injectable()
export default class StandardFeeFactory implements IPaymentDetailsFactory<StandardFee> {
    private readonly defaultFeeIssuer = 'UNICREDIT BULBANK';

    public tryCreate(transactionReference: string, transactionDetailsNodes: Node[]): StandardFee {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('')
            .cleanTransactionDetails();

        const transaction: StandardFee = {
            beneficiary: this.defaultFeeIssuer,
            description: transactionDetailsRaw,
        }

        return transaction;
    }
}