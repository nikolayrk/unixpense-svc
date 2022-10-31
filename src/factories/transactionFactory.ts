import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import EntryType from '../enums/entryType';
import Transaction from '../models/transaction';
import TransactionType from '../models/transactionType';
import TransactionTypeFactory from '../models/transactionTypeFactory';
import { gmail_v1 } from 'googleapis';
import XRegExp from 'xregexp';

export default class TransactionFactory {
    private readonly transactionTypeFactories: Partial<Record<string, TransactionTypeFactory<TransactionType>>>;

    private static readonly emptyDescription: TransactionType = {
        beneficiary: ''
    }

    constructor() {
        this.transactionTypeFactories = {
            // 'Операция с карта': ...,
            // 'Периодична такса': ...,
            // 'Комунално плaщане': ...,
            // 'Комунално плащане mBanking': ...,
            // 'Комунално плащане BBO': ...,
            // 'Такса за превод': ...,
            // 'Периодично плащане': ...,
            // 'Получен вътр.банков превод': ...,
            // 'Издаден вътр.банков превод': ...,
            // 'Вътрешнобанков превод': ...,
            // 'Вътрешнобанков превод FC': ...,
            // 'Вътрешно банков превод Payroll': ...,
            // 'Такса за вътрешнобанков превод': ...,
            // "Погасяване на главница': ...,
            // "Погасяв.на л-ва за редовна главница': ...,
            // "Застрахователна премия': ...,
            // 'Плащане на лихва': ...,
            // 'Удържане на данък в/у лихва': ...,
            // 'Платежно нареждане извън банката': ...,
            // 'Получен междубанков превод': ...,
            // 'Такса за междубанков превод': ...,
            // 'Издаване на превод във валута': ...,
            // 'Такси издадени валутни преводи': ...,
        };
    }

    public create(message: gmail_v1.Schema$Message, attachmentData: string): Transaction<TransactionType> {
        if (message.id === null || message.id === undefined) {
            throw new Error(`Missing message ID`);
        }

        const txnData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        const date = dateParse(txnData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss').getTime();

        const reference = txnData[3]
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

        if (entryType === EntryType.INVALID) {
            throw new Error(`Transaction reference ${reference}: Unregonised transaction entry '${entryTypeStr}'`);
        }

        const transactionType = txnData[11]
            .childNodes
            .map(n => {
                const regex = XRegExp('(?:[^\\/])*((?=\\p{Lu})\\p{Cyrillic}*[\\W]+.*)');
                const regexResult = regex.exec(n.rawText);
                const type = regexResult?.[0];

                return type;
            })
            .filter(n => n !== '')
            .slice(0, 1)?.[0];

        const transactionTypeValid = transactionType !== undefined;

        const transactionDetails = txnData.slice(11);

        const description = this.tryCreateDescription(transactionType, transactionDetails, reference);
        
        const descriptionValid = description !== null;

        const finalDescription = transactionTypeValid && descriptionValid
            ? description
            : TransactionFactory.emptyDescription;

        const transaction: Transaction<TransactionType> = {
            messageId: message.id,
            date: date,
            reference: reference,
            valueDate: valueDate,
            sum: sum,
            entryType: entryType,
            description: finalDescription
        }

        return transaction;
    }

    private tryCreateDescription(transactionType: string | undefined, transactionDetails: Node[], reference: string) {
        if (transactionType === undefined) {
            return null;
        }

        const transactionTypeFactory = this.transactionTypeFactories[transactionType];
        const description = transactionTypeFactory?.tryCreate(transactionDetails);

        if (description === undefined) {
            throw new Error(`Transaction reference ${reference}: Unsupported transaction type '${transactionType}'`);
        }

        return description;
    }
}