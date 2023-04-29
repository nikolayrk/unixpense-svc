import { AbstractPaymentDetailsStrategy } from "../../strategies/abstractPaymentDetailsStrategy";
import CrossBorderTransfer from "../../../shared/models/crossBorderTransfer";
import PaymentDetailsProcessingError from "../../../shared/errors/paymentDetailsProcessingError";

export default class GmailCrossBorderTransferStrategy extends AbstractPaymentDetailsStrategy<CrossBorderTransfer> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): CrossBorderTransfer {
        const transactionDetailsRaw = paymentDetailsRaw.join('')

        const regex = /(?:AZV-)?(\w[^,]+)/g;
        const matches = [...transactionDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const beneficiary = paymentDetails[0];
        const description = paymentDetails.slice(1, 5).join(', ');
        const iban = paymentDetails[7];

        if (beneficiary === undefined || description === undefined || iban === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        return this.paymentDetailsFactory.crossBorderTransfer(beneficiary, iban, description);
    }
}