import PaymentDetails from "../types/paymentDetails";

export abstract class AbstractPaymentDetailsStrategy<T extends PaymentDetails> {
    /**
     * @throws PaymentDetailsProcessingError
    **/
    abstract tryCreate(paymentDetailsRaw: string[], additionalDetailsRaw: string[]): T;
}

