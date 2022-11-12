import XRegExp from "xregexp";

declare global {
    interface String {
        cleanTransactionDetails(this: string): string
    }
}

String.prototype.cleanTransactionDetails = function (this: string) {
    const regex = XRegExp('[\\/]*((?=\\p{Lu})\\p{Cyrillic}+.*)');

    const transactionDetailsClean = this
        .replace(regex, '')
        .replace(/\/+$/, '')
        .trim();

    return transactionDetailsClean;
}
