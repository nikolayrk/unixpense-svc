import TransactionType from "../../../../enums/transactionType";
import CrossBorderTransfer from "../../../../models/crossBorderTransfer";
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";

export const crossBorderTransferTestCases: PaymentDetailsTestCase<CrossBorderTransfer>[] = [
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
        
export default crossBorderTransferTestCases;