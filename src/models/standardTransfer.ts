import PaymentDetails from "./paymentDetails";

export default interface StandardTransfer extends PaymentDetails {
    iban: string;
    description: string;
}