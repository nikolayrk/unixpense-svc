import StandardTransfer from "../../core/types/standardTransfer";
import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";

export default class GmailStandardTransferStrategy extends AbstractPaymentDetailsStrategy<StandardTransfer> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): StandardTransfer {
        const beneficiary = additionalDetailsRaw?.[1] ?? '';
        const iban = additionalDetailsRaw?.[0] ?? '';
        const description = paymentDetailsRaw.join('\n');

        return this.paymentDetailsFactory.standardTransfer(beneficiary, iban, description);
    }
}