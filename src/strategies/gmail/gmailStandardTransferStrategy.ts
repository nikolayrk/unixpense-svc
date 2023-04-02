import StandardTransfer from "../../models/standardTransfer";
import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import { injectable } from "inversify";

@injectable()
export default class GmailStandardTransferStrategy extends AbstractPaymentDetailsStrategy<StandardTransfer> {
    public tryCreate(transactionReference: string, paymentDetailsRaw: string[], additionalDetailsRawOrNull: string[] | null): StandardTransfer {
        const beneficiary = additionalDetailsRawOrNull?.[1] ?? '';
        const iban = additionalDetailsRawOrNull?.[0] ?? '';
        const description = paymentDetailsRaw
            .join('');

        return this.paymentDetailsFactory.standardTransfer(beneficiary, iban, description);
    }
}