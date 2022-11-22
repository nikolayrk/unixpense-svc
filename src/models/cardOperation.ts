import PaymentDetails from "./paymentDetails";

export default interface CardOperation extends PaymentDetails {
    instrument: string;
    sum: string;
    currency: string;
}
