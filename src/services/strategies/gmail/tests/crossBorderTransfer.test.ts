import CrossBorderTransfer from "../../../../models/crossBorderTransfer";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import transactionDataTestCases from "./transactionData.test.cases";
import { crossBorderTransferTestCases } from "./crossBorderTransfer.test.cases";

describePaymentDetailsTests<CrossBorderTransfer>(
    'Cross Border Transfer Tests',
    transactionDataTestCases,
    crossBorderTransferTestCases);