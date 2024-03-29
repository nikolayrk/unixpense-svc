import { injectable } from "inversify";
import CardOperation from "../types/cardOperation";
import StandardTransfer from "../types/standardTransfer";

@injectable()
export default class PaymentDetailsFactory {
    private static readonly defaultFeeRecipient = 'UNICREDIT BULBANK';
    private static readonly defaultIban = 'N/A';
    private static readonly defaultDescription = 'N/A';
    
    public cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            recipient: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
    }

    public standardTransfer(recipient: string, recipientIban: string, description: string) {
        return {
            recipient: recipient,
            recipientIban: recipientIban,
            description: description
        } as StandardTransfer;
    }

    public crossBorderTransfer(recipient: string, iban: string, description: string) {
        return this.standardTransfer(recipient, iban, description);
    }

    public crossBorderTransferFee(description: string) {
        return this.standardTransfer(PaymentDetailsFactory.defaultFeeRecipient, PaymentDetailsFactory.defaultIban, description);
    }

    public deskWithdrawal(recipient: string, description: string) {
        return this.standardTransfer(recipient, PaymentDetailsFactory.defaultIban, description);
    }

    public standardFee(description: string | null) {
        return this.standardTransfer(PaymentDetailsFactory.defaultFeeRecipient, PaymentDetailsFactory.defaultIban, description ?? PaymentDetailsFactory.defaultDescription);
    }
}