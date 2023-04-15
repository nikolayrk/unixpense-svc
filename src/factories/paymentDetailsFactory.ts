import { injectable } from "inversify";
import CardOperation from "../models/cardOperation";
import DeskWithdrawal from "../models/deskWithdrawal";
import StandardFee from "../models/standardFee";
import StandardTransfer from "../models/standardTransfer";

@injectable()
export default class PaymentDetailsFactory {
    public cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            recipient: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
    }

    public deskWithdrawal(beneficiary: string, description: string, additionalDetails: string) {
        return {
            recipient: beneficiary,
            description: description,
            additionalDetails: additionalDetails
        } as DeskWithdrawal;
    }

    public standardFee(beneficiary: string, description: string) {
        return {
            recipient: beneficiary,
            description: description
        } as StandardFee;
    }

    public standardTransfer(beneficiary: string, recipientIban: string, description: string) {
        return {
            recipient: beneficiary,
            recipientIban: recipientIban,
            description: description
        } as StandardTransfer;
    }

    public crossBorderTransfer(beneficiary: string, iban: string, description: string) {
        return this.standardTransfer(beneficiary, iban, description);
    }
}