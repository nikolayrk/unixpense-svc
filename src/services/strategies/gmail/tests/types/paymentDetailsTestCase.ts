import PaymentDetails from "../../../../../shared/models/paymentDetails";
import { TransactionDataBody } from '../../../../../shared/models/transactionData';

export type PaymentDetailsTestCase<T extends PaymentDetails> = {
  testName: string;
  attachmentDataBody: string;
  expectedTransactionDataBody: TransactionDataBody;
  expectedPaymentDetails: T;
};
