import { describe, it, expect } from '@jest/globals';
import { TransactionExtensions } from './transactionExtensions';
import { gmailPaymentDetailsTestCases } from '../../gmail/types/gmailPaymentDetailsTestCases';
import TransactionTestHelper from '../utils/transactionTestHelper';
import './globalExtensions';

describe('Transaction Extensions Tests', () => {
    it('should map all valid transactions to responses then back to models again', async () => {
        const transactionTestHelper = await new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise();
        
        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const responses = transactions.map(TransactionExtensions.toResponse);
        const models = responses.map(TransactionExtensions.toModel);

        expect(transactions).toEqual(models);
    });
});