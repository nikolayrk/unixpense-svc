import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";
import CrossBorderTransfer from "../../core/types/crossBorderTransfer";
import PaymentDetailsProcessingError from "../../core/errors/paymentDetailsProcessingError";
import { PaymentDetailsFactory } from "../../core/factories/paymentDetailsFactory";

export default class GmailCrossBorderTransferStrategy extends AbstractPaymentDetailsStrategy<CrossBorderTransfer> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): CrossBorderTransfer {
        const transactionDetailsRaw = paymentDetailsRaw.join('')

        const regex = /(?:AZV-)?(\w[^,]+)/g;
        const matches = [...transactionDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const beneficiary = paymentDetails[0];
        const description = paymentDetails.slice(1, paymentDetails.length - 2).join(', '); // Skip BIC
        const iban = paymentDetails[paymentDetails.length - 1];

        if (beneficiary === undefined || description === undefined || iban === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        return PaymentDetailsFactory.crossBorderTransfer(beneficiary, iban, description);
    }
}