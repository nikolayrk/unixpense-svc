import { injectable } from "inversify";
import CardOperation from "../models/cardOperation";
import CrossBorderTransfer from "../models/crossBorderTransfer";
import DeskWithdrawal from "../models/deskWithdrawal";
import StandardFee from "../models/standardFee";
import StandardTransfer from "../models/standardTransfer";

@injectable()
export default class PaymentDetailsFactory {
    public cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            beneficiary: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
    }

    public crossBorderTransfer(beneficiary: string, iban: string, description: string) {
        return {
            beneficiary: beneficiary,
            iban: iban,
            description: description
        } as CrossBorderTransfer;
    }

    public deskWithdrawal(beneficiary: string, description: string, additionalDetails: string) {
        return {
            beneficiary: beneficiary,
            description: description,
            additionalDetails: additionalDetails
        } as DeskWithdrawal;
    }

    public standardFee(beneficiary: string, description: string) {
        return {
            beneficiary: beneficiary,
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
}