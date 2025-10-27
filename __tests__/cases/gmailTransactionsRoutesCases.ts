import { expect, it } from "@jest/globals";
import TransactionRepository from "../../src/core/repositories/transactionRepository";
import Constants from "@shared/constants";
import { TransactionExtensions } from "../../src/core/extensions/transactionExtensions";
import { AxiosError } from "axios";
import TransactionTestHelper from "../../src/core/utils/transactionTestHelper";
import { gmailPaymentDetailsTestCases } from "../../src/gmail/types/gmailPaymentDetailsTestCases";
import { ApiClient } from "../helpers/apiClient";

export const gmailTransactionsRoutesCases = (apiClient: ApiClient, transactionRepository: TransactionRepository) => {
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
        const promise = apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid last amount provided: xxx" }
            }
        });
    });

    it('should error out with a negative last value', async () => {
        const promise = apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/-1`);

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
        
        const promise = apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=xxx`);

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
        
        const promise = apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=-1`);

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

        const response = await apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/${expectedTransactionIds.length}`);

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

        const response = await apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`);

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

        const response = await apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`);

        expect(response).toMatchObject({
            status: 200,
            data: [],
        });
    });

    it('should error out while trying to resolve a transaction', async () => {
        const promise = apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .post(`/api/transactions/gmail/resolve`, [ Constants.Mock.errorTransactionSourceId ]);

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

        const response = await apiClient
            .withBearerToken(Constants.Mock.accessToken)
            .post(`/api/transactions/gmail/resolve`, transactionIds);

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });
}