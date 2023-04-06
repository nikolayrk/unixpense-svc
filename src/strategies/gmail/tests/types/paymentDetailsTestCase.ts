import PaymentDetails from "../../../../models/paymentDetails";
import { TransactionDataBody } from '../../../../models/transactionData';

export type PaymentDetailsTestCase<T extends PaymentDetails> = {
  testName: string;
  attachmentDataBody: string;
  expectedTransactionDataBody: TransactionDataBody;
  expectedPaymentDetails: T;
};
