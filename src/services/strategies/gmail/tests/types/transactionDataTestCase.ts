import { TransactionDataHead } from '../../../../../models/transactionData';

export type TransactionDataTestCase = {
  testName: string;
  attachmentDataHead: string;
  includePadding: boolean;
  expectedTransactionDataHead: TransactionDataHead;
};
