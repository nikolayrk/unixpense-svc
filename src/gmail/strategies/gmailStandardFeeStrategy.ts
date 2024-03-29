import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";
import StandardFee from "../../core/types/standardFee";

export default class GmailStandardFeeStrategy extends AbstractPaymentDetailsStrategy<StandardFee> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): StandardFee {
        const description = paymentDetailsRaw.length > 0
            ? paymentDetailsRaw.join('')
            : null;

        return this.paymentDetailsFactory.standardFee(description);
    }
}