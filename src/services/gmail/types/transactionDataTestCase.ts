import { TransactionDataHead } from '../../../shared/models/transactionData';

export type TransactionDataTestCase = {
  testName: string;
  attachmentDataHead: string;
  includePadding: boolean;
  expectedTransactionDataHead: TransactionDataHead;
};
