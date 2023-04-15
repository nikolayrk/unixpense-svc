import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import StandardFee from "../../models/standardFee";
import { injectable } from "inversify";

@injectable()
export default class GmailStandardFeeStrategy extends AbstractPaymentDetailsStrategy<StandardFee> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): StandardFee {
        const description = paymentDetailsRaw.length > 0
            ? paymentDetailsRaw.join('')
            : null;

        return this.paymentDetailsFactory.standardFee(description);
    }
}