import DeskWithdrawal from "../../../../models/deskWithdrawal";
import transactionDataTestCases from "./transactionData.test.cases";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import { deskWithdrawalTestCases } from "./deskWithdrawal.test.cases";

describePaymentDetailsTests<DeskWithdrawal>(
  'Desk Withdrawal Tests',
  transactionDataTestCases,
  deskWithdrawalTestCases);