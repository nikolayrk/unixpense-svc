import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import CrossBorderTransfer from "../../models/crossBorderTransfer";
import PaymentDetailsProcessingError from "../../errors/paymentDetailsProcessingError";
import { injectable } from "inversify";

@injectable()
export default class GmailCrossBorderTransferStrategy extends AbstractPaymentDetailsStrategy<CrossBorderTransfer> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null): CrossBorderTransfer {
        const transactionDetailsRaw = paymentDetailsRaw
            .join('')

        const regex = /(?:AZV-)?(\w[^,]+)/g;
        const matches = [...transactionDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const beneficiary = paymentDetails[0];
        const description = paymentDetails[3];
        const iban = paymentDetails[7];

        if (beneficiary === undefined || description === undefined || iban === undefined) {
            throw new PaymentDetailsProcessingError(`Failed to execute regex on input '${transactionDetailsRaw}'`);
        }

        return this.paymentDetailsFactory.crossBorderTransfer(beneficiary, iban, description);
    }
}