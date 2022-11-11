import PaymentDetails from "./paymentDetails";

export default interface StandardTransfer extends PaymentDetails {
    type: string;
    iban: string;
    description: string;
}