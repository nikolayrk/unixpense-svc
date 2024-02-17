import EntryType from "../../core/enums/entryType";
import { TransactionDataTestCase } from "../../core/types/transactionDataTestCase";
import { generateTransactionReference } from "../../core/utils/transactionUtils";
import { parse as dateParse } from 'date-format-parse';

export const constructGmailTransactionDataTestCase = (transactionId: string): TransactionDataTestCase => {
    const reference = generateTransactionReference(transactionId);
    
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
            date: dateParse('31.03.2023 14:56:31', 'DD.MM.YYYY HH:mm:ss'),
            reference: reference,
            valueDate: dateParse('30.03.2023', 'DD.MM.YYYY'),
            sum: '4.48',
            entryType: EntryType.DEBIT,
        }
    }
};