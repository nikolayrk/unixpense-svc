import CardOperation from "../../../models/cardOperation";
import describePaymentDetailsTests from "./utils/describePaymentDetails";
import transactionDataTestCases from "./transactionData.test.cases";
import { cardOperationTestCases } from "./cardOperation.test.cases";

describePaymentDetailsTests<CardOperation>(
    'Card Operation Tests',
    transactionDataTestCases,
    cardOperationTestCases);
