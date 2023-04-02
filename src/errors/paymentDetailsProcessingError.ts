export default class PaymentDetailsProcessingError extends Error {
    constructor(transactionReference: string, message: string, stack?: string) {
        const fullMessage = `Failed to process payment details of transaction with reference ${transactionReference}: ${message}`
            
        super(fullMessage);

        this.name = "PaymentDetailsProcessingError";
        this.message = fullMessage;
        this.stack = stack;
    }
}
  