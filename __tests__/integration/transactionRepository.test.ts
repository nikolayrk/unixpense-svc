import { describe, it, expect } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { injectables } from '../../src/core/types/injectables';
import TransactionRepository from '../../src/core/repositories/transactionRepository';
import { gmailPaymentDetailsTestCases } from '../../src/gmail/types/gmailPaymentDetailsTestCases';
import TransactionTestHelper from '../../src/core/utils/transactionTestHelper';
import RepositoryError from '../../src/core/errors/repositoryError';
import integrationTestBase from './integration.test.base';
import axios, { AxiosInstance } from 'axios';
import Constants from '../../src/constants';

describe('Transaction Repository Tests', () => {
    let apiClient: AxiosInstance;
    let transactionRepository: TransactionRepository;

    integrationTestBase({ beforeAllAppendix: async () => {
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        apiClient = axios.create({ baseURL: Constants.baseUrl });
    }});

    it('should throw a repository error', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise();
        
        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        await expect(() => transactionRepository.bulkCreateAsync(transactions))
            .rejects
            .toThrow(RepositoryError);
    });

    Object.entries(gmailPaymentDetailsTestCases).map(([ transactionId, _ ]) =>
        it(`should persist transaction of type ${transactionId}`, async () => {
            const transaction = new TransactionTestHelper()
                .withTestCases(gmailPaymentDetailsTestCases)
                .useGmailContext()
                .resolveTransaction(transactionId);
            const transactions = [transaction];
            
            await expect(transactionRepository.bulkCreateAsync(transactions))
                .resolves
                .toBe(1);
        })
    );
});