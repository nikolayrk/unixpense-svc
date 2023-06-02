import TransactionType from "../../core/enums/transactionType";
import StandardFee from "../../core/models/standardFee";
import { PaymentDetailsTestCase } from "../../core/types/paymentDetailsTestCase";
import describePaymentDetailsTests from "../../core/utils/describePaymentDetails";
import describeTransactionDataTests from "../../core/utils/describeTransactionData";
import transactionDataTestCases from "./gmailTransactionData.test.cases";

const standardFeeTestCases: PaymentDetailsTestCase<StandardFee>[] = [
    {   testName: 'PERIODIC_FEE',
        attachmentDataBody: `
            <td nowrap="" align="left">Периодична такса<br><br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.PERIODIC_FEE,
            paymentDetailsRaw: [],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'N/A',
        }
    },
    {   testName: 'INTERBANK_TRANSFER_FEE',
        attachmentDataBody: `
            <td nowrap="" align="left">Такса за междубанков превод<br><br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERBANK_TRANSFER_FEE,
            paymentDetailsRaw: [],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'N/A',
        }
    },
    {   testName: 'TRANSFER_FEE',
        attachmentDataBody: `
          <td nowrap="" align="left">Такса за превод<br><br><br></td>
          <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.TRANSFER_FEE,
            paymentDetailsRaw: [],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'N/A',
        }
    },
    {   testName: 'INTERNAL_TRANSFER_FEE',
        attachmentDataBody: `
            <td nowrap="" align="left">Такса за вътрешнобанков превод<br><br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERNAL_TRANSFER_FEE,
            paymentDetailsRaw: [],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'N/A',
        }
    },
    {   testName: 'WITHDRAWAL_FEE',
        attachmentDataBody: `
            <td nowrap="" align="left"><br>ТЕГЛ.НА КАСА /Такса за теглене над определена сума<br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.WITHDRAWAL_FEE,
            paymentDetailsRaw: [ 'ТЕГЛ.НА КАСА' ],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'ТЕГЛ.НА КАСА',
        }
    },
];

describePaymentDetailsTests<StandardFee>('Gmail > Standard Fee > Payment Details Tests', transactionDataTestCases, standardFeeTestCases);

describeTransactionDataTests('Gmail > Standard Fee > Transaction Data Tests', transactionDataTestCases, standardFeeTestCases);
