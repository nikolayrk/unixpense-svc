import { describe, it, expect } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { injectables } from '../../src/core/types/injectables';
import Constants from '../../src/constants';
import TransactionRepository from '../../src/core/repositories/transactionRepository';
import { TransactionExtensions } from '../../src/core/extensions/transactionExtensions';
import { gmailPaymentDetailsTestCases } from '../../src/gmail/types/gmailPaymentDetailsTestCases';
import TransactionTestHelper from '../../src/core/utils/transactionTestHelper';
import axios, { AxiosError, AxiosInstance } from 'axios';
import integrationTestBase from './integration.test.base';

describe('Gmail Transactions Routes Tests', () => {
    let apiClient: AxiosInstance;
    let transactionRepository: TransactionRepository;

    integrationTestBase({ beforeAllAppendix: () => {
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        apiClient = axios.create({ baseURL: Constants.baseUrl });
    }});

    it('should error out with a missing access token', async () => {
        const promise = apiClient.get(`/api/transactions/gmail/ids/last/1`);

        await expect(promise).rejects.toThrow('Request failed with status code 401');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "No access token provided" }
            }
        });
    });

    it('should error out with an invalid last value', async () => {
        const promise = apiClient.get(`/api/transactions/gmail/ids/last/xxx`, {
            headers: {
                Authorization: `Bearer ${Constants.Mock.accessToken}`
            }
        });

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid last amount provided: xxx" }
            }
        });
    });

    it('should error out with a negative last value', async () => {
        const promise = apiClient.get(`/api/transactions/gmail/ids/last/-1`, {
            headers: {
                Authorization: `Bearer ${Constants.Mock.accessToken}`
            }
        });

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid last amount provided: -1" }
            }
        });
    });

    it('should error out with an invalid skip depth value', async () => {
        const transactionIds = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomCount()
            .resolveTransactionIds();
        
        const promise = apiClient.get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=xxx`, {
            headers: {
                Authorization: `Bearer ${Constants.Mock.accessToken}`
            }
        });

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid skip depth provided: xxx" }
            }
        });
    });

    it('should error out with a negative skip depth value', async () => {
        const transactionIds = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomCount()
            .resolveTransactionIds();
        
        const promise = apiClient.get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=-1`, {
            headers: {
                Authorization: `Bearer ${Constants.Mock.accessToken}`
            }
        });

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid skip depth provided: -1" }
            }
        });
    });

    it('should fetch a random number of transaction IDs', async () => {
        const expectedTransactionIds = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomCount()
            .resolveTransactionIds();

        const response = await apiClient.get(`/api/transactions/gmail/ids/last/${expectedTransactionIds.length}`, {
                headers: {
                    Authorization: `Bearer ${Constants.Mock.accessToken}`
                }
            });

        expect(response).toMatchObject({
            status: 200,
            data: expectedTransactionIds,
        });
    });

    it('should fetch a random number of transaction IDs and skip a portion', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomCount();
        
        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));
                    
        const halfwayPoint = Math.floor(transactions.length / 2);
        const existingTransactionsCount = Math.floor(Math.random() * (halfwayPoint - 1) + 1);
        const skipDepth = existingTransactionsCount + 1;

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));
        
        const expectedTransactionIds = transactions
            .slice(existingTransactionsCount)
            .map(t => t.id);

        const response = await apiClient.get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`, {
                headers: {
                    Authorization: `Bearer ${Constants.Mock.accessToken}`
                }
            });

        expect(response).toMatchObject({
            status: 200,
            data: expectedTransactionIds,
        });
    });

    it('should fetch an empty array after entering skip depth constraints', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomCount();
        
        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const halfwayPoint = Math.ceil(transactions.length / 2);
        const existingTransactionsCount = Math.floor(Math.random() * (halfwayPoint - 1) + 1);
        const skipDepth = existingTransactionsCount;

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));

        const response = await apiClient.get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`, {
                headers: {
                    Authorization: `Bearer ${Constants.Mock.accessToken}`
                }
            });

        expect(response).toMatchObject({
            status: 200,
            data: [],
        });
    });

    it('should error out while trying to resolve a transaction', async () => {
        const promise = apiClient.post(`/api/transactions/gmail/resolve`, [ Constants.Mock.errorTransactionSourceId ], {
                headers: {
                    Authorization: `Bearer ${Constants.Mock.accessToken}`
                }
            });

        await expect(promise).rejects.toThrow('Request failed with status code 500');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_RESPONSE,
            response: {
                data: { error: Constants.Mock.errorTransactionSourceId }
            }
        });
    }, 20000); // Account for exponential backoff

    it('should resolve a random number of transactions', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();
        
        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const transactionIds = transactions.map(t => t.id);

        const expected = transactions.map(t => TransactionExtensions.toResponse(t));

        const response = await apiClient.post(`/api/transactions/gmail/resolve`, transactionIds, {
            headers: {
                Authorization: `Bearer ${Constants.Mock.accessToken}`
            }
        });

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });
});