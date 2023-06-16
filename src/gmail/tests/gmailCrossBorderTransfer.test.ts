import TransactionType from "../../core/enums/transactionType";
import CrossBorderTransfer from "../../core/models/crossBorderTransfer";
import { PaymentDetailsTestCase } from "../types/paymentDetailsTestCase";
import describePaymentDetailsTests from "../utils/describePaymentDetails";
import describeTransactionDataTests from "../utils/describeTransactionData";
import transactionDataTestCases from "./gmailTransactionData.test.cases";

const crossBorderTransferTestCases: PaymentDetailsTestCase<CrossBorderTransfer>[] = [
    {   testName: 'CROSS_BORDER_TRANSFER',
        attachmentDataBody: `
            <td nowrap="" align="left">, BUNQNL2AXXX , NL48BUNQ4950396806,   ,  ,/Издаване на превод във валута<br>AZV-Treehouse Distribution, Ord.Ref: NOTPROVIDED, HEDG, , T-535685  , GPP Ref.: 2243120123, , 1.9585<br><br></td>
            <td align="center"></td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.CROSS_BORDER_TRANSFER,
            paymentDetailsRaw: [ 'AZV-Treehouse Distribution, Ord.Ref: NOTPROVIDED, HEDG, , T-535685  , GPP Ref.: 2243120123, , 1.9585, BUNQNL2AXXX , NL48BUNQ4950396806,   ,  ,' ],
            additionalDetailsRaw: []
        },
        expectedPaymentDetails: {
            recipient: 'Treehouse Distribution',
            recipientIban: 'NL48BUNQ4950396806',
            description: 'Ord.Ref: NOTPROVIDED, HEDG, T-535685, GPP Ref.: 2243120123'
        }
    },
];

describePaymentDetailsTests<CrossBorderTransfer>('Gmail > Cross Border Transfer > Payment Details Tests', transactionDataTestCases, crossBorderTransferTestCases);

describeTransactionDataTests('Gmail > Cross Border Transfer > Transaction Data Tests', transactionDataTestCases, crossBorderTransferTestCases);
