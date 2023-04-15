import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import StandardFee from "../../models/standardFee";
import { injectable } from "inversify";

@injectable()
export default class GmailStandardFeeStrategy extends AbstractPaymentDetailsStrategy<StandardFee> {
    private readonly defaultFeeIssuer = 'UNICREDIT BULBANK';

    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null): StandardFee {
        const description = paymentDetailsRaw
            .join('');

        return this.paymentDetailsFactory.standardFee(this.defaultFeeIssuer, description);
    }
}