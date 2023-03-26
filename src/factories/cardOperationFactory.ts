import { IPaymentDetailsFactory } from "../contracts/IPaymentDetailsFactory";
import CardOperation from "../models/cardOperation";
import { Node } from 'node-html-parser';
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";
import { injectable } from "inversify";

@injectable()
export default class CardOperationFactory implements IPaymentDetailsFactory<CardOperation> {
    public tryCreate(transactionReference: string, transactionDetailsNodes: Node[]): CardOperation {
        const transactionDetailsRaw = transactionDetailsNodes
            .slice(1)
            .map(c => c.rawText)
            .join('');

        const regex = /^(?<instrument>[^\d]+)\s(?<sum>[^\s]+)\s(?<currency>\w*)[,]?\sавт.код:(?:[^\s,-]*)[\s]*[-]?[,]?[\s]?(?<merchant>[^\/]+(?<! ))/;

        const regexResult = regex.exec(transactionDetailsRaw);

        if (regexResult === null) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        const instrument = regexResult.groups?.instrument;
        const sum = regexResult.groups?.sum;
        const currency = regexResult.groups?.currency;
        const merchant = regexResult.groups?.merchant;

        if (instrument === undefined || sum === undefined || currency === undefined || merchant === undefined) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to read regex capture group`);
        }

        const paymentDetails: CardOperation = {
            instrument: instrument,
            sum: sum,
            currency: currency,
            beneficiary: merchant
        }

        return paymentDetails;
    }
}