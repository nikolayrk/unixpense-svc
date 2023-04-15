import PaymentDetails from "./paymentDetails";

export default interface StandardTransfer extends PaymentDetails {
    recipientIban: string;
    description: string;
}