import StandardTransfer from "../../../models/standardTransfer";
import transactionDataTestCases from "./transactionData.test.cases";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import { standardTransferTestCases } from "./standardTransfer.test.cases";

describePaymentDetailsTests<StandardTransfer>(
  'Standard Transfer Tests',
  transactionDataTestCases,
  standardTransferTestCases);
