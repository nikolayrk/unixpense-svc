export default class FailedToProcessTxnError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "FailedToProcessTxnError";
    }
}
  