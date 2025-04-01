import CardOperation from "../types/cardOperation";
import StandardTransfer from "../types/standardTransfer";

export class PaymentDetailsFactory {
    private static readonly defaultFeeRecipient = 'UNICREDIT BULBANK';
    private static readonly defaultIban = 'N/A';
    private static readonly defaultDescription = 'N/A';
    
    public static cardOperation(merchant: string, instrument: string, sum: string, currency: string) {
        return {
            recipient: merchant,
            instrument: instrument,
            sum: sum,
            currency: currency
        } as CardOperation;
    }

    public static standardTransfer(recipient: string, recipientIban: string, description: string) {
        return {
            recipient: recipient,
            recipientIban: recipientIban,
            description: description
        } as StandardTransfer;
    }

    public static crossBorderTransfer(recipient: string, iban: string, description: string) {
        return this.standardTransfer(recipient, iban, description);
    }

    public static crossBorderTransferFee(description: string) {
        return this.standardTransfer(PaymentDetailsFactory.defaultFeeRecipient, PaymentDetailsFactory.defaultIban, description);
    }

    public static deskWithdrawal(recipient: string, description: string) {
        return this.standardTransfer(recipient, PaymentDetailsFactory.defaultIban, description);
    }

    public static standardFee(description: string | null) {
        return this.standardTransfer(PaymentDetailsFactory.defaultFeeRecipient, PaymentDetailsFactory.defaultIban, description ?? PaymentDetailsFactory.defaultDescription);
    }
}