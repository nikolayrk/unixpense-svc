import { AbstractPaymentDetailsStrategy } from "../abstractPaymentDetailsStrategy";
import { injectable } from "inversify";
import DeskWithdrawal from "../../models/deskWithdrawal";

@injectable()
export default class GmailDeskWithdrawalStrategy extends AbstractPaymentDetailsStrategy<DeskWithdrawal> {
    public tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): DeskWithdrawal {
        const description = paymentDetailsRaw[0];

        const beneficiary = paymentDetailsRaw[1].replace(`${description} `, '');

        return this.paymentDetailsFactory.deskWithdrawal(beneficiary, description);
    }
}