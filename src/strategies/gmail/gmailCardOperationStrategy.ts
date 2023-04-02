import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import CardOperation from "../../models/cardOperation";
import PaymentDetailsProcessingError from "../../errors/paymentDetailsProcessingError";
import { injectable } from "inversify";

@injectable()
export default class GmailCardOperationStrategy extends AbstractPaymentDetailsStrategy<CardOperation> {
    public tryCreate(transactionReference: string, paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null): CardOperation {
        const raw = paymentDetailsRaw
            .join('');

        const regex = /^(?<instrument>[^\d]+)\s(?<sum>[^\s]+)\s(?<currency>\w*)[,]?\sавт.код:(?:[^\s,-]*)[\s]*[-]?[,]?[\s]?(?<merchant>[^\/]+(?<! ))/;

        const regexResult = regex.exec(raw);

        if (regexResult === null) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to execute regex on input '${raw}'`);
        }

        const instrument = regexResult.groups?.instrument;
        const sum = regexResult.groups?.sum;
        const currency = regexResult.groups?.currency;
        const merchant = regexResult.groups?.merchant;

        if (instrument === undefined || sum === undefined || currency === undefined || merchant === undefined) {
            throw new PaymentDetailsProcessingError(transactionReference, `Failed to read regex capture group`);
        }

        return this.paymentDetailsFactory.cardOperation(merchant, instrument, sum, currency);
    }
}