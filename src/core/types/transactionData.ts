import EntryType from "../enums/entryType";
import TransactionType from "../enums/transactionType";

interface TransactionDataHead {
    date: Date,
    reference: string,
    valueDate: Date,
    sum: string,
    entryType: EntryType,
}

interface TransactionDataBody {
    transactionType: TransactionType,
    paymentDetailsRaw: string[],
    additionalDetailsRaw: string[]
}

interface TransactionData extends TransactionDataHead, TransactionDataBody { }

export {
    TransactionDataHead,
    TransactionDataBody,
    TransactionData
}