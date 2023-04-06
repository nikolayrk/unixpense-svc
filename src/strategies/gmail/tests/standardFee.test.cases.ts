import TransactionType from "../../../enums/transactionType";
import StandardFee from "../../../models/standardFee";
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";

export const standardFeeTestCases: PaymentDetailsTestCase<StandardFee>[] = [
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
            beneficiary: 'UNICREDIT BULBANK',
            description: '',
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
            beneficiary: 'UNICREDIT BULBANK',
            description: '',
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
            beneficiary: 'UNICREDIT BULBANK',
            description: '',
        }
    },
    {   testName: 'CROSS_BORDER_TRANSFER_FEE',
        attachmentDataBody: `
            <td nowrap="" align="left"><br>AZV-Commission  for GPP transaction Ref.: 2283100163/Такси издадени валутни преводи<br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.CROSS_BORDER_TRANSFER_FEE,
            paymentDetailsRaw: [ 'AZV-Commission  for GPP transaction Ref.: 2283100163' ],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            beneficiary: 'UNICREDIT BULBANK',
            description: 'AZV-Commission  for GPP transaction Ref.: 2283100163',
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
            beneficiary: 'UNICREDIT BULBANK',
            description: '',
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
            beneficiary: 'UNICREDIT BULBANK',
            description: 'ТЕГЛ.НА КАСА',
        }
    },
];
    
export default standardFeeTestCases;