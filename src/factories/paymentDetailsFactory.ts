import { injectable } from "inversify";
import CardOperation from "../models/cardOperation";
import StandardTransfer from "../models/standardTransfer";
import PaymentDetails from "../models/paymentDetails";

@injectable()
export default class PaymentDetailsFactory {
    public static readonly default: PaymentDetails = {
        recipient: '<N/A>'
    };

    private readonly defaultIban = 'N/A';
    private readonly defaultDescription = 'N/A';
    
    public cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            recipient: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
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

    public standardFee(beneficiary: string, description: string | null) {
        return this.standardTransfer(beneficiary, this.defaultIban, description ?? this.defaultDescription);
    }
}