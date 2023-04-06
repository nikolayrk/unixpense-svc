import TransactionType from "../../../enums/transactionType";
import CrossBorderTransfer from "../../../models/crossBorderTransfer";
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
            beneficiary: 'Treehouse Distribution',
            iban: 'NL48BUNQ4950396806',
            description: 'T-535685'
        }
    },
];
        
export default crossBorderTransferTestCases;