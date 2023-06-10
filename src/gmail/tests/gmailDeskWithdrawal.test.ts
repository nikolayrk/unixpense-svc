import TransactionType from "../../core/enums/transactionType";
import DeskWithdrawal from "../../core/models/deskWithdrawal";
import { PaymentDetailsTestCase } from "../../core/types/paymentDetailsTestCase";
import describePaymentDetailsTests from "../utils/describePaymentDetails";
import describeTransactionDataTests from "../utils/describeTransactionData";
import transactionDataTestCases from "./gmailTransactionData.test.cases";

const deskWithdrawalTestCases: PaymentDetailsTestCase<DeskWithdrawal>[] = [
    {   testName: 'DESK_WITHDRAWAL',
        attachmentDataBody: `
            <td nowrap="nowrap" align="left"><br />ТЕГЛ.НА КАСА /Теглене на пари на каса от клнт с-к<br />ТЕГЛ.НА КАСА ИВАН ИВАНОВ ИВАНОВ<br /></td>
            <td align="center">
              <table width="100%">
                <tr>
                  <td align="right" nowrap="nowrap">501149563</td>
                </tr>
                <tr>
                  <td align="right" nowrap="nowrap"></td>
                </tr>
              </table>
            </td>`,
        expectedTransactionDataBody: {
          transactionType: TransactionType.DESK_WITHDRAWAL,
          paymentDetailsRaw: [
            'ТЕГЛ.НА КАСА',
            'ТЕГЛ.НА КАСА ИВАН ИВАНОВ ИВАНОВ'
          ],
          additionalDetailsRaw: [ '501149563' ]
        },
        expectedPaymentDetails: {
            recipient: 'ИВАН ИВАНОВ ИВАНОВ',
            recipientIban: 'N/A',
            description: 'ТЕГЛ.НА КАСА'
        }
    },
];

describePaymentDetailsTests<DeskWithdrawal>('Gmail > Desk Withdrawal > Payment Details Tests', transactionDataTestCases, deskWithdrawalTestCases);

describeTransactionDataTests('Gmail > Desk Withdrawal > Transaction Data Tests', transactionDataTestCases, deskWithdrawalTestCases);
