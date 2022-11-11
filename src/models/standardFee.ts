import PaymentDetails from "./paymentDetails";

export default interface StandardFee extends PaymentDetails {
    type: string
    description: string;
}