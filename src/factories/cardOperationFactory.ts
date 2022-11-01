import PaymentDetailsFactory from "../models/paymentDetailsFactory";
import CardOperation from "../models/cardOperation";
import { Node } from 'node-html-parser';
import PaymentDetailsProcessingError from "../errors/paymentDetailsProcessingError";

export default class CardOperationFactory implements PaymentDetailsFactory<CardOperation> {
    public create(transactionDetails: Node[]): CardOperation {
        const transactionDetailsRaw = transactionDetails[0]
            .childNodes
            .slice(1)
            .map((c) => c.rawText)
            .join('');

        const regex = /^(?<instrument>[^\d]+)\s(?<sum>[^\s]+)\s(?<currency>\w*)[,]?\sавт.код:(?:[^\s,-]*)[\s]*[-]?[,]?[\s]?(?<merchant>[^\/]+(?<! ))/;

        const regexResult = regex.exec(transactionDetailsRaw);

        if (regexResult === null) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        const instrument = regexResult.groups?.instrument;
        const sum = regexResult.groups?.sum;
        const currency = regexResult.groups?.currency;
        const merchant = regexResult.groups?.merchant;

        if (instrument === undefined || sum === undefined || currency === undefined || merchant === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to read regex capture group`);
        }

        const paymentDetails: CardOperation = {
            instrument: instrument,
            sum: Number(sum),
            currency: currency,
            beneficiary: merchant
        }

        return paymentDetails;
    }
}