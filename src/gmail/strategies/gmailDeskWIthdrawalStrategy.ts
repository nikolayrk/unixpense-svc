import { AbstractPaymentDetailsStrategy } from "../../core/strategies/abstractPaymentDetailsStrategy";
import DeskWithdrawal from "../../core/types/deskWithdrawal";

export default class GmailDeskWithdrawalStrategy extends AbstractPaymentDetailsStrategy<DeskWithdrawal> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): DeskWithdrawal {
        const description = paymentDetailsRaw[0];

        const beneficiary = paymentDetailsRaw[1].replace(`${description} `, '');

        return this.paymentDetailsFactory.deskWithdrawal(beneficiary, description);
    }
}