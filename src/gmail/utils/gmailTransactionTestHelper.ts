import { parse as dateParse } from 'date-format-parse';
import { GmailTransactionDataTestCase } from '../types/gmailTransactionDataTestCase';
import { GmailPaymentDetailsTestCaseData, gmailPaymentDetailsTestCases } from '../types/gmailPaymentDetailsTestCases';
import seedrandom from 'seedrandom';
import EntryType from '../../core/enums/entryType';
import TransactionData from '../../core/types/transactionData';
import TransactionFactory from '../../core/factories/transactionFactory';

export default class GmailTransactionTestHelper {
    private readonly attachmentPaddingTop = `
        <html>
        <head>
        </head>
        <body><table cellspacing="1" cellpadding="0" border="0" width="100%" class="address">
            <tr>
            <td>
                <font size="5">
                <b>УниКредит Булбанк</b>
                </font>
            </td>
            <td width="17%" align="right" />
            </tr>
        </table>
        <hr size="1" />
        <table cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
            <td width="17%">
                <font style="font-family:Arial;font-size:10.0pt;font-weight:bold;">Дата: </font>
                <font class="style0">05.08.2022 13:05:26</font>
            </td>
            </tr>
            <tr>
            <td align="left">
                <br />
                <font style="font-family:Arial;font-size:12.0pt;font-weight:bold;">Информация за операция по сметка</font>
            </td>
            </tr>
        </table>
        <p> </p>
        <font class="style0">
            <b>Сметка</b>:
                                    
                                    01</font>
        <table cellspacing="2" cellpadding="2" border="0" width="100%" class="style0">
            <tr>
            <td> </td>
            </tr>
            <tr>
            <td class="td-header" nowrap="nowrap" width="15%">Салдо към дата 
                                                        05.08.2022 13:04:35</td>
            <td width="15%" align="left">1234.56</td>
            <td> </td>
            </tr>
        </table>
        <table bordercolor="black" cellspacing="0" cellpadding="4" width="100%" class="style0" BORDER="1" FRAME="BOX" RULES="NONE">
            <tr>
            <td class="td-header" align="center" width="15%">Дата на обработка</td>
            <td class="td-header" align="center" width="5%">Референция</td>
            <td class="td-header" align="center" width="10%">Вальор</td>
            <td class="td-header" align="right" width="5%">Сума</td>
            <td class="td-header" align="center" width="5%">Тип</td>
            <td class="td-header" align="left" width="40%">Описание</td>
            <td class="td-header" align="center" width="25%">Детайли БИСЕРА</td>
            </tr>
            <tr>
            <td colspan="7">
                <hr size="1" />
            </td>
            </tr>
            <tr>` as const;

    private readonly attachmentPaddingBottom = `
            </tr>
            <tr>
            <td colspan="7">
                <hr size="1" />
            </td>
            </tr>
            <tr>
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            <td class="td-header" height="1" />
            </tr>
        </table>
        <br />
        </body>
        </html>` as const;

    public resolveTransactionDataSource(transactionId: string, encode: boolean = false) {
        const [transactionDataTestCase, paymentDetailsTestCase] = this.resolveTestCase(transactionId);
        const attachmentData = `${
            this.attachmentPaddingTop}${
            transactionDataTestCase.attachmentDataHead}${
            paymentDetailsTestCase.attachmentDataBody}${
            this.attachmentPaddingBottom
        }`;

        return encode
            ? this.encodeAttachmentData(attachmentData)
            : attachmentData;
    }

    public resolveTransactionData(transactionId: string) {
        const [transactionDataTestCase, paymentDetailsTestCase] = this.resolveTestCase(transactionId);
        const transactionData = {
            ...transactionDataTestCase.expectedTransactionDataHead,
            ...paymentDetailsTestCase.expectedTransactionDataBody,
        } as TransactionData;

        return transactionData;
    }

    public resolvePaymentDetails(transactionId: string) {
        const [_, paymentDetailsTestCase] = this.resolveTestCase(transactionId);
        const paymentDetails = paymentDetailsTestCase.expectedPaymentDetails;

        return paymentDetails;
    }

    public resolveTransaction(transactionId: string) {
        const transactionData = this.resolveTransactionData(transactionId);
        const paymentDetails = this.resolvePaymentDetails(transactionId);

        return TransactionFactory.create(transactionId, transactionData, paymentDetails);
    }

    private resolveTestCase(transactionId: string): [GmailTransactionDataTestCase, GmailPaymentDetailsTestCaseData] {
        const paymentDetailsTestCase = gmailPaymentDetailsTestCases[transactionId];

        if (paymentDetailsTestCase === undefined) {
            throw new Error(`No transaction with id ${transactionId} found`);
        }

        const transactionDataTestCase = this.constructTransactionDataTestCase(transactionId);

        return [transactionDataTestCase, paymentDetailsTestCase];
    }

    private constructTransactionDataTestCase(transactionId: string): GmailTransactionDataTestCase {
        const reference = this.generateTransactionReference(transactionId);
        
        return {
            attachmentDataHead: `
                    <td nowrap="" align="center">31.03.2023 14:56:31</td>
                    <td nowrap="" align="right">
                        <font color="blue" data-darkreader-inline-color="" style="--darkreader-inline-color:#337dff;">${reference}</font>
                    </td>
                    <td nowrap="" align="center">30.03.2023</td>
                    <td nowrap="" align="right">4.48</td>
                    <td nowrap="" align="center">ДТ</td>`,
            expectedTransactionDataHead: {
                date: dateParse('31.03.2023 14:56:31'.padUTCTimezone(), 'DD.MM.YYYY HH:mm:ssZ').fromLocaltoUTC(),
                reference: reference,
                valueDate: dateParse('30.03.2023'.padTime().padUTCTimezone(), 'DD.MM.YYYY HH:mm:ssZ'),
                sum: '4.48',
                entryType: EntryType.DEBIT,
            }
        }
    }

    private generateTransactionReference(seed: string) {
        const rng = seedrandom(seed);
        const random = Math.floor(rng() * Math.pow(10, 17));
        const reference = random
            .toString(16)
            .toUpperCase();

        return reference;
    }
    
    private encodeAttachmentData(attachmentData: string): string {
        const base64Encoded = Buffer
            .from(attachmentData, 'utf16le')
            .toString('base64');
        
        const base64Url = this.toBase64Url(base64Encoded);
    
        return base64Url;
    }
    
    private toBase64Url(input: string): string {
        return input
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
    }
}
