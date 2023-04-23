import TransactionType from "../../../../shared/enums/transactionType";
import CrossBorderTransferFee from "../../../../shared/models/crossBorderTransferFee";
import { PaymentDetailsTestCase } from "../types/paymentDetailsTestCase";
import describePaymentDetailsTests from "../utils/describePaymentDetails";
import describeTransactionDataTests from "../utils/describeTransactionData";
import transactionDataTestCases from "./transactionData.test.cases";

const crossBorderTransferFeeTestCases: PaymentDetailsTestCase<CrossBorderTransferFee>[] = [
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

describePaymentDetailsTests<CrossBorderTransferFee>('Cross Border Transfer Fee > Payment Details Tests', transactionDataTestCases, crossBorderTransferFeeTestCases);

describeTransactionDataTests('Gmail > Cross Border Transfer Fee > Transaction Data Tests', transactionDataTestCases, crossBorderTransferFeeTestCases);
