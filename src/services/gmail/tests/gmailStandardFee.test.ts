import TransactionType from "../../../shared/enums/transactionType";
import StandardFee from "../../../shared/models/standardFee";
import { PaymentDetailsTestCase } from "../../../shared/types/paymentDetailsTestCase";
import describePaymentDetailsTests from "../../../shared/utils/describePaymentDetails";
import describeTransactionDataTests from "../../../shared/utils/describeTransactionData";
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
