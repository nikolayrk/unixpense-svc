import TransactionData from './transactionData';

export type TransactionDataTestCase = {
  attachmentDataHead: string;
  expectedTransactionDataHead: Partial<TransactionData>;
};
