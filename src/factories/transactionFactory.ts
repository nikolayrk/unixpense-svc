import { parse as htmlParse } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import EntryType from '../enums/entryType';
import Transaction from '../models/transaction';
import TransactionType from '../models/transactionTypes';
import TransactionTypeFactory from '../models/transactionTypeFactory';

export default class TransactionFactory {
    private readonly transactionTypeFactories: Partial<Record<string, TransactionTypeFactory<TransactionType>>>;

    constructor() {
        this.transactionTypeFactories = {
            // "Операция с карта": ...,
            // "Периодична такса": ...
            // "Комунално плaщане": ...,
            // "Такса за превод": ...,
            // "Периодично плащане": ...,
            // "Получен вътр.банков превод": ...,
            // "Погасяване на главница": ...,
            // "Погасяв.на л-ва за редовна главница": ...,
            // "Застрахователна премия": ...,
        };
    }

    public create(messageId: string, attachmentData: string): Transaction<TransactionType> {
        const txnData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        const date = dateParse(txnData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss').getTime();

        const referece = txnData[3]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const valueDate = dateParse(txnData[5]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY').getTime();

        const sum = Number(txnData[7]
            .childNodes[0]
            .rawText);

        const entryTypeStr = txnData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        const transactionType = txnData[11]
            .childNodes[0]
            .rawText;

        const transactionDetails = txnData.slice(11);

        const transactionTypeFactory = this.transactionTypeFactories[transactionType];

        try {
            const description = transactionTypeFactory?.create(transactionDetails);

            if (description === undefined) {
                throw new Error(`Failed to process transaction with type ${transactionType}`);
            }

            const transaction: Transaction<TransactionType> = {
                messageId: messageId,
                date: date,
                referece: referece,
                valueDate: valueDate,
                sum: sum,
                entryType: entryType,
                description: description
            }

            return transaction;
        } catch(ex) {
            throw ex;
        }
    }
}