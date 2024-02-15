import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";
import CardOperation from "../../core/types/cardOperation";
import PaymentDetailsProcessingError from "../../core/errors/paymentDetailsProcessingError";

export default class GmailCardOperationStrategy extends AbstractPaymentDetailsStrategy<CardOperation> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): CardOperation {
        const raw = paymentDetailsRaw.join('');

        const regex = /^(?<instrument>[^\d]+)\s(?<sum>[^\s]+)\s(?<currency>\w*)[,]?\sавт.код:(?:[^\s,-]*)[\s]*[-]?[,]?[\s]?(?<merchant>[^\/]+(?<! ))/;

        const regexResult = regex.exec(raw);

        if (regexResult === null) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${raw}'`);
        }

        const instrument = regexResult.groups?.instrument;
        const sum = regexResult.groups?.sum;
        const currency = regexResult.groups?.currency;
        const merchant = regexResult.groups?.merchant;

        if (instrument === undefined || sum === undefined || currency === undefined || merchant === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to read regex capture group`);
        }

        return this.paymentDetailsFactory.cardOperation(merchant, instrument, sum, currency);
    }
}