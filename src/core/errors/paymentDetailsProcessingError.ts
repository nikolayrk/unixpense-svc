export default class PaymentDetailsProcessingError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "PaymentDetailsProcessingError";
    }
}
  