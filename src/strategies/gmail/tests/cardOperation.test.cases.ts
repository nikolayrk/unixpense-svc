import TransactionType from "../../../enums/transactionType";
import CardOperation from "../../../models/cardOperation";
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";

export const cardOperationTestCases: PaymentDetailsTestCase<CardOperation>[] = [
    {   testName: 'CARD_OPERATION > ПОС',
        attachmentDataBody: `
            <td nowrap="" align="left">Операция с карта<br><br>ПОС 4.48 BGN авт.код:833023-GLOBAL RETAIL HOLDING EOO/VARNA/PAN:4402****5296/CT:<wbr>01<br></td>
            <td align="center">
                <table width="100%">
                    <tbody><tr>
                        <td align="right" nowrap="">4591TATB0</td>
                    </tr>
                    <tr>
                        <td align="right" nowrap=""></td>
                    </tr>
                </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.CARD_OPERATION,
            paymentDetailsRaw: [ 'ПОС 4.48 BGN авт.код:833023-GLOBAL RETAIL HOLDING EOO/VARNA/PAN:4402****5296/CT:01' ],
            additionalDetailsRaw: [ '4591TATB0' ],
        },
        expectedPaymentDetails: {
            beneficiary: 'GLOBAL RETAIL HOLDING EOO',
            instrument: 'ПОС',
            sum: '4.48',
            currency: 'BGN'
        }
    },
    {   testName: 'CARD_OPERATION > Плащане /импринтер/ + multiline txn type at EOL',
        attachmentDataBody: `
            <td nowrap="" align="left">та<br>Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08 /Операция с кар<br>Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08<br></td>
            <td align="center">
            <table width="100%">
                <tbody><tr>
                    <td align="right" nowrap="">4591TATB0</td>
                </tr>
                <tr>
                    <td align="right" nowrap=""></td>
                </tr>
            </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.CARD_OPERATION,
            paymentDetailsRaw: [
                'Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08',
                'Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08'
            ],
            additionalDetailsRaw: [ '4591TATB0' ]
        },
        expectedPaymentDetails: {
            beneficiary: 'EATALYS',
            instrument: 'Плащане /импринтер/',
            sum: '4.92',
            currency: 'BGN'
        }
    },
];

export default cardOperationTestCases;