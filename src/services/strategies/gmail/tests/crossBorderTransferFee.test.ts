import CrossBorderTransferFee from "../../../../models/crossBorderTransferFee";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import transactionDataTestCases from "./transactionData.test.cases";
import crossBorderTransferFeeTestCases from "./crossBorderTransferFee.test.cases";

describePaymentDetailsTests<CrossBorderTransferFee>(
    'Cross Border Transfer Fee Tests',
    transactionDataTestCases,
    crossBorderTransferFeeTestCases);