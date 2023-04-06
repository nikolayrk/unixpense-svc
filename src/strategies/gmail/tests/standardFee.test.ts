import StandardFee from "../../../models/standardFee";
import transactionDataTestCases from "./transactionData.test.cases";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import { standardFeeTestCases } from "./standardFee.test.cases";

describePaymentDetailsTests<StandardFee>(
    'Standard Fee Tests',
    transactionDataTestCases,
    standardFeeTestCases);
