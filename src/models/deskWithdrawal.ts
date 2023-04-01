import PaymentDetails from "./paymentDetails";

export default interface DeskWithdrawal extends PaymentDetails {
    description: string;
    additionalDetails: string;
}