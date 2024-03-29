import CrossBorderTransferFee from "../../core/types/crossBorderTransferFee";
import StandardTransfer from "../../core/types/standardTransfer";
import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";

export default class GmailCrossBorderTransferFeeStrategy extends AbstractPaymentDetailsStrategy<CrossBorderTransferFee> {
    tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): StandardTransfer {
        const transactionDetailsRaw = paymentDetailsRaw.join('');
        const regex = /(?:AZV-)(.+)/g;
        const matches = [...transactionDetailsRaw.matchAll(regex)];

        const paymentDetails = matches.map(m => m[1].trim());

        const description = paymentDetails.join('');

        return this.paymentDetailsFactory.crossBorderTransferFee(description);
    }
}