export default class UnsupportedTxnError extends Error {
    constructor(message: string) {
        super(message);

        this.name = "UnsupportedTxnError";
    }
}
  