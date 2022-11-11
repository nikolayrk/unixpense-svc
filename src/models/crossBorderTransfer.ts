import PaymentDetails from "./paymentDetails";

export default interface CrossBorderTransfer extends PaymentDetails {
    iban: string;
    description: string;
}