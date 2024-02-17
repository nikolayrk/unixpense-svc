import PaymentDetails from "./paymentDetails";

export interface PaymentDetailsTestCaseData {
    expectedPaymentDetails: PaymentDetails;
}

export type PaymentDetailsTestCase<T extends PaymentDetailsTestCaseData> = Record<string, T>;
