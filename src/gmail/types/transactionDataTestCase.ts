import TransactionData from '../../core/types/transactionData';
import EntryType from "../../core/enums/entryType";
import { parse as dateParse } from 'date-format-parse';
import seedrandom from 'seedrandom';

export type TransactionDataTestCase = {
  attachmentDataHead: string;
  expectedTransactionDataHead: Partial<TransactionData>;
};

const generateReference = (seed: string) => {
  const rng = seedrandom(seed);
  const random = Math.floor(rng() * Math.pow(10, 17));
  const reference = random
    .toString(16)
    .toUpperCase();

  return reference;
}

export const constructTransactionDataTestCase = (transactionId: string): TransactionDataTestCase => {
  const reference = generateReference(transactionId);
  
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