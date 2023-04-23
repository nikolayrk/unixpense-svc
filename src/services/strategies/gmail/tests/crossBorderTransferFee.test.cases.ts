import TransactionType from "../../../../enums/transactionType";
import CrossBorderTransferFee from "../../../../models/crossBorderTransferFee";
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";

export const crossBorderTransferFeeTestCases: PaymentDetailsTestCase<CrossBorderTransferFee>[] = [
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
            recipient: 'UNICREDIT BULBANK',
            recipientIban: 'N/A',
            description: 'Commission  for GPP transaction Ref.: 2283100163',
        }
    },
];
    
export default crossBorderTransferFeeTestCases;