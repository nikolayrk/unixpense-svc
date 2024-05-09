import TransactionData from '../../core/types/transactionData';

export type GmailTransactionDataTestCase = {
  attachmentDataHead: string;
  expectedTransactionDataHead: Partial<TransactionData>;
};
