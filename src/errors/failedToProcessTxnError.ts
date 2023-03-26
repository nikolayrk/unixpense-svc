export default class FailedToProcessTxnError extends Error {
    constructor(messageId: string, message: string) {
        const fullMessage = `Failed to process transaction from message with ID ${messageId}: ${message}`;

        super(fullMessage);

        this.name = "FailedToProcessTxnError";
    }
}
  