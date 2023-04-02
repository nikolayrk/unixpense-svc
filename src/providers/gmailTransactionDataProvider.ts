import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse} from 'date-format-parse';
import EntryType from '../enums/entryType';
import { TRANSACTION_TYPES } from '../types/transactionTypeString';
import transactionTypesByString from '../types/transactionTypeByString';
import { injectable } from 'inversify';
import ITransactionDataProvider from '../contracts/ITransactionDataProvider';
import TransactionData from '../models/transactionData';
import TransactionType from '../enums/transactionType';

@injectable()
export default class GmailTransactionDataProvider implements ITransactionDataProvider {
    public get(transactionDataRaw: string) {
        const transactionDataHtml = this.parseTransactionDataHtml(transactionDataRaw);

        const date = this.parseDate(transactionDataHtml);
        const reference = this.parseReference(transactionDataHtml);
        const valueDate = this.parseValueDate(transactionDataHtml);
        const sum = this.parseSum(transactionDataHtml);
        const entryType = this.parseEntryType(transactionDataHtml);
        const {
            transactionType,
            paymentDetailsRaw
        } = this.parseTransactionType(transactionDataHtml);
        const additionalDetailsRaw = this.parseAdditionalDetails(transactionDataHtml);

        const transactionData: TransactionData = {
            date,
            reference,
            valueDate,
            sum,
            entryType,
            transactionType,
            paymentDetailsRaw,
            additionalDetailsRawOrNull: additionalDetailsRaw
        };

        return transactionData;
    }

    private parseTransactionDataHtml(attachmentData: string) {
        const transactionData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        return transactionData;
    }

    private parseDate(transactionData: Node[]) {
        const date = dateParse(transactionData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss');

        return date;
    }

    private parseReference(transactionData: Node[]) {
        const reference = transactionData[3]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        return reference;
    }

    private parseValueDate(transactionData: Node[]) {
        const valueDate = dateParse(transactionData[5]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY');

        return valueDate;
    }

    private parseSum(transactionData: Node[]) {
        const sum = transactionData[7]
            .childNodes[0]
            .rawText;

        return sum;
    }

    private parseEntryType(transactionData: Node[]) {
        const entryTypeStr = transactionData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        if (entryType === EntryType.INVALID) {
            console.log(`Unregonised entry type '${entryTypeStr}'`);
        }

        return entryType;
    }

    private parseTransactionType(transactionData: Node[]) {
        const dataRaw = transactionData[11]
            .childNodes
            .map(e => e.rawText.trim())
            .filter(e => e != '');

        const typeRegex = new RegExp(`([ ]?[\/]?(${TRANSACTION_TYPES.join('|')})[ ]?)`);

        dataRaw.forEach(e => console.log(JSON.stringify(typeRegex.exec(e))));

        const found = dataRaw
            .map(e => typeRegex.exec(e)?.[2])
            .flat()?.[0] ?? null;

        const typeByString = found as keyof typeof transactionTypesByString;

        const valid = 
            found !== null &&
            TRANSACTION_TYPES.includes(typeByString);

        const transactionType = valid
            ? transactionTypesByString[typeByString]
            : TransactionType.UNKNOWN;

        const paymentDetailsRaw = dataRaw
            .map(e => e.replace(typeRegex, ''))
            .filter(e => e != '');

        return { transactionType, paymentDetailsRaw };
    }

    private parseAdditionalDetails(transactionData: Node[]) {
        const additionalDetailsNode = transactionData
            ?.[13]
            ?.childNodes
            ?.[1];

        const additionalDetails = additionalDetailsNode
            ?.childNodes
            ?.map(e => e.rawText.split('\n'))
            ?.flat()
            ?.map(e => e.trim())
            ?.filter(e => e != '') ?? null;

        return additionalDetails;
    }
}