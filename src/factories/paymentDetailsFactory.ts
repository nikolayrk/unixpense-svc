import { injectable } from "inversify";
import CardOperation from "../models/cardOperation";
import StandardFee from "../models/standardFee";
import StandardTransfer from "../models/standardTransfer";
import PaymentDetails from "../models/paymentDetails";

@injectable()
export default class PaymentDetailsFactory {
    public static readonly default: PaymentDetails = {
        recipient: '<N/A>'
    };

    private readonly defaultIban = 'N/A';
    
    public cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            recipient: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
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

    public deskWithdrawal(beneficiary: string, description: string) {
        return this.standardTransfer(beneficiary, this.defaultIban, description);
    }
}