import describeTransactionDataTests from "./utils/describeTransactionData";
import cardOperationTestCases from './cardOperation.test.cases';
import crossBorderTransferTestCases from './crossBorderTransfertest.cases';
import deskWithdrawalTestCases from './deskWithdrawal.test.cases';
import standardFeeTestCases from './standardFee.test.cases';
import standardTransferTestCases from './standardTransfer.test.cases';
import transactionDataTestCases from './transactionData.test.cases';
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";
import PaymentDetails from "../../../models/paymentDetails";

const paymentDetailsTestCases: PaymentDetailsTestCase<PaymentDetails>[] = [
    ...cardOperationTestCases,
    ...crossBorderTransferTestCases,
    ...deskWithdrawalTestCases,
    ...standardFeeTestCases,
    ...standardTransferTestCases
]

describeTransactionDataTests('Transaction Data Tests', transactionDataTestCases, paymentDetailsTestCases);