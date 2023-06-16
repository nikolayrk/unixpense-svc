import PaymentDetails from "../../core/models/paymentDetails";
import { TransactionDataBody } from '../../core/models/transactionData';

export type PaymentDetailsTestCase<T extends PaymentDetails> = {
  testName: string;
  attachmentDataBody: string;
  expectedTransactionDataBody: TransactionDataBody;
  expectedPaymentDetails: T;
};
