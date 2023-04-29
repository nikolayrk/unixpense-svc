import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse} from 'date-format-parse';
import { inject, injectable } from 'inversify';
import ILogger from '../../contracts/ILogger';
import ITransactionDataProvider from '../../contracts/ITransactionDataProvider';
import { injectables } from '../../../shared/types/injectables';
import { TransactionData } from '../../../shared/models/transactionData';
import EntryType from '../../../shared/enums/entryType';
import { TRANSACTION_TYPES } from '../../../shared/types/transactionTypeString';
import transactionTypesByString from '../../../shared/types/transactionTypeByString'
import TransactionType from '../../../shared/enums/transactionType';

@injectable()
export default class GmailTransactionDataProvider implements ITransactionDataProvider {
    private readonly logger: ILogger;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger
    ) {
        this.logger = logger;
    }

    public get(transactionDataRaw: string) {
        const transactionDataHtml = this.parseTransactionDataHtml(transactionDataRaw);

        const date = this.parseDate(transactionDataHtml);
        const reference = this.parseReference(transactionDataHtml);
        const valueDate = this.parseValueDate(transactionDataHtml);
        const sum = this.parseSum(transactionDataHtml);
        const entryType = this.parseEntryType(transactionDataHtml, reference);
        const {
            transactionType,
            paymentDetailsRaw
        } = this.parseTransactionType(transactionDataHtml, reference);
        const additionalDetailsRaw = this.parseAdditionalDetails(transactionDataHtml);

        const transactionData: TransactionData = {
            date,
            reference,
            valueDate,
            sum,
            entryType,
            transactionType,
            paymentDetailsRaw,
            additionalDetailsRaw: additionalDetailsRaw
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

    private parseEntryType(transactionData: Node[], transactionReference: string) {
        const entryTypeStr = transactionData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        if (entryType === EntryType.INVALID) {
            this.logger.warn(`Unregonised entry type '${entryTypeStr}'`, { transactionReference: transactionReference });
        }

        return entryType;
    }

    private parseTransactionType(transactionData: Node[], transactionReference: string) {
        const maxDataLineLength = 100;
        const dataElementCount = transactionData[11].childNodes.length;
        let dataRawCount = 0;
        const dataRaw = transactionData[11]
            .childNodes
            .reduce((accumulator, current, i) => {
                const currentString = current.toString();

                // Treat <br> variants as linebreaks
                if (currentString === '<br>' || currentString === '<br />') {
                    return accumulator;
                }

                // Don't treat <wbr> as a linebreak
                if (dataRawCount > 0 && accumulator[dataRawCount-1] === '<wbr>') {
                    accumulator.pop(); // pop the <wbr>

                    const last = accumulator.pop(); // pop and collect the element preceeding <wbr>
                    const updated = last?.concat(currentString) // combine the last element with the current one

                    accumulator.push(updated ?? currentString); // push either the concatenated elements, or only the current one

                    return accumulator;
                }

                // Don't add <wbr> if it's the last element (meaning it won't be removed by the previous clause)
                if (i == dataElementCount && currentString === '<wbr>') {
                    return accumulator;
                }

                // If the current element is longer than the maximum data line length, append the last element to it
                if (dataRawCount > 0 && currentString.length >= maxDataLineLength) {
                    const last = accumulator.pop() ?? ''; // pop and colect the last element
                    const updated = currentString.concat(last); // combine the current element with the last one

                    accumulator.push(updated);

                    return accumulator;
                }

                accumulator.push(currentString);
                dataRawCount++;

                return accumulator;
            }, [] as string[]);

        const typeRegex = new RegExp(`([ ]?[\/]?(${TRANSACTION_TYPES.join('|')})[ ]?)`);

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

        if (transactionType === TransactionType.UNKNOWN) {
            this.logger.warn(`Unknown transaction type '${found}'`, { transactionReference: transactionReference });
        }

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
            ?.filter(e => e != '') ?? [];

        return additionalDetails;
    }
}