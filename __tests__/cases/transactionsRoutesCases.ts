import { it, expect } from "@jest/globals";
import { AxiosError } from "axios";
import { EntryTypeExtensions } from "../../src/core/extensions/entryTypeExtensions";
import { TransactionExtensions } from "../../src/core/extensions/transactionExtensions";
import { TransactionTypeExtensions } from "../../src/core/extensions/transactionTypeExtensions";
import TransactionFactory from "../../src/core/factories/transactionFactory";
import TransactionRepository from "../../src/core/repositories/transactionRepository";
import TransactionTestHelper from "../../src/core/utils/transactionTestHelper";
import { gmailPaymentDetailsTestCases } from "../../src/gmail/types/gmailPaymentDetailsTestCases";
import { ApiClient } from "../helpers/apiClient";
import PaymentDetailsContext from "../../src/core/contexts/paymentDetailsContext";

export const transactionsRoutesCases = (apiClient: ApiClient, transactionRepository: TransactionRepository) => {
    it('should fail to query transactions due to passing an invalid fromDate value', async () => {
        const promise = apiClient.get(`/api/transactions?fromDate=xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid fromDate value: xxx" }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid toDate value', async () => {
        const promise = apiClient.get(`/api/transactions?toDate=xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid toDate value: xxx" }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid since value', async () => {
        const promise = apiClient.get(`/api/transactions?since=xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid since value: xxx" }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid count value', async () => {
        const promise = apiClient.get(`/api/transactions?count=xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid count value: xxx" }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid date range', async () => {
        const fromDate = new Date();
        const toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() - 1);

        const fromDateQuery = fromDate.toQuery();
        const toDateQuery = toDate.toQuery();

        const promise = apiClient.get(`/api/transactions?fromDate=${fromDateQuery}&toDate=${toDateQuery}`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: `Invalid date range: ${fromDate.toResponse()} - ${toDate.toResponse()}` }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid sum value', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();

        const promise = apiClient.get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=xxx`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Invalid sum value: xxx" }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid sum range', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const fromSum = 3;
        const toSum = 2;

        const promise = apiClient.get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=${fromSum}&toSum=${toSum}`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: `Invalid sum range: ${fromSum} - ${toSum}` }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid type', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const typeQuery = 'xxx';

        const promise = apiClient.get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&types=${typeQuery}`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: `Invalid types value: ${typeQuery}` }
            }
        });
    });

    it('should fail to query transactions due to passing an invalid entryType', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const entryTypeQuery = 'xxx';

        const promise = apiClient.get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&entryTypes=${entryTypeQuery}`);

        await expect(promise).rejects.toThrow('Request failed with status code 400');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: `Invalid entryTypes value: ${entryTypeQuery}` }
            }
        });
    });

    it('should persist a random number of transactions then query them back by date', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        const dateQuery = date.toQuery();

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&fromDate=${dateQuery}&toDate=${dateQuery}`);

        const expected = transactions.map(TransactionExtensions.toResponse).sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist a random number of transactions then query them back by since date', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const date = new Date(transactions
            .map(t => t.date)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!);
        date.setSeconds(date.getSeconds()+1);
        const dateQuery = date.toISOString();

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&since=${dateQuery}`);

        const expected = transactions.map(TransactionExtensions.toResponse).sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist a random number of transactions then query back an empty array per since date', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const date = transactions
            .map(t => t.date)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        const dateQuery = date.toQuery();

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&since=${dateQuery}`);

        expect(response).toMatchObject({
            status: 200,
            data: [],
        });
    });

    it('should persist a random number of transactions then query them back by sum', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const sum = transactions
            .map(t => Number(t.sum))
            .sort((first: number, second: number) => first - second)
            .at(0) as number;

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&fromSum=${sum}&toSum=${sum}`);

        const expected = transactions.map(TransactionExtensions.toResponse).sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist a random number of transactions then query them back by type', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const types = transactions
            .map(t => t.type)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => TransactionTypeExtensions.toOrdinalEnum(String(t)));
        const typesQuery = types
            .map(t => `&types=${t}`)
            .join('');

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}${typesQuery}`);

        const expected = transactions.map(TransactionExtensions.toResponse).sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist a random number of transactions then query them back by entryType', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const entryTypes = transactions
            .map(t => t.entryType)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => EntryTypeExtensions.toOrdinalEnum(String(t)));
        const entryTypesQuery = entryTypes
            .map(t => `&entryTypes=${t}`)
            .join('');

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&${entryTypesQuery}`);

        const expected = transactions.map(TransactionExtensions.toResponse).sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist a random number of transactions then query them back by recipient', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const _ = await transactionRepository.bulkCreateAsync(transactions);

        const recipientQuery = transactions
            .map(t => t.paymentDetails.recipient)
            .reduce((acc, curr) => {
                if(!acc.includes(curr)) {
                    acc.push(curr);
                }
                return acc;
            }, [] as string[])
            .filter(r => r !== PaymentDetailsContext.DefaultPaymentDetails.recipient)
            .join(' ');

        const response = await apiClient.get(`/api/transactions?count=${transactions.length}&recipient=${encodeURIComponent(recipientQuery)}`);

        const expected = transactions
            .filter(t => t.paymentDetails.recipient !== PaymentDetailsContext.DefaultPaymentDetails.recipient)
            .map(TransactionExtensions.toResponse)
            .sort((a, b) => b.id.localeCompare(a.id));

        expect(response).toMatchObject({
            status: 200,
            data: expected,
        });
    });

    it('should persist all valid transactions then query each one back by description', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases);

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const resolveDescription = (t: Record<string, any>) => t.paymentDetails.instrument ?? t.paymentDetails.description;

        const filteredTransactions = transactions
                .filter(t => resolveDescription(t) !== undefined &&
                             resolveDescription(t) !== "" &&
                             resolveDescription(t) !== "N/A")

        const _ = await transactionRepository.bulkCreateAsync(filteredTransactions);

        await Promise.all(filteredTransactions
            .map(async t => {
                const description = resolveDescription(t);
                const descriptionQuery = encodeURIComponent(`"${String(description)}"`);

                const response = await apiClient.get(`/api/transactions?description=${descriptionQuery}`);

                const expected = TransactionExtensions.toResponse(t);

                expect(response.status).toEqual(200);
                expect(response.data).toContainEqual(expected);
            }));
    });

    it('should persist a random number of transactions', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const transactionsResponse = transactions.map(TransactionExtensions.toResponse);

        const response = await apiClient.post(`/api/transactions/save`, transactionsResponse);

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));

        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));
        const added = expectedTransactionIds.length;

        expect(response).toMatchObject({
            status: 201,
            data: { message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`},
        });

        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    it('should persist a random number of transactions and skip a portion', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount();

        const transactions = transactionTestHelper
            .resolveTransactionIds()
            .map(id => transactionTestHelper
                .useGmailContext()
                .resolveTransaction(id));

        const existingTransactionsCount = Math.floor(Math.random() * (transactions.length - 1) + 1);

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));

        const transactionsResponse = transactions.map(TransactionExtensions.toResponse);

        const response = await apiClient.post(`/api/transactions/save`, transactionsResponse);

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));
        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));
        const added = transactions.length - existingTransactionsCount;

        expect(response).toMatchObject({
            status: 201,
            data: { message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`},
        });

        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    it('should persist a random number of transactions and update a portion', async () => {
        const transactionTestHelper = new TransactionTestHelper()
            .withTestCases(gmailPaymentDetailsTestCases);

        const transactionTestHelperRandomised = transactionTestHelper
            .randomise()
            .randomCount();

        const gmailTransactionTestHelper = transactionTestHelper.useGmailContext();

        const transactions = transactionTestHelperRandomised
            .resolveTransactionIds()
            .map(id => gmailTransactionTestHelper.resolveTransaction(id));

        await transactionRepository.bulkCreateAsync(transactions);

        const transactionsToUpdateCount = Math.floor(Math.random() * (transactions.length - 1) + 1);
        const transactionsToUpdate = transactions.slice(0, transactionsToUpdateCount);
        const updatedTransactions = transactionsToUpdate
            .map(transaction => {
                const gmailTransactionIds = Object.keys(gmailPaymentDetailsTestCases);
                const randomTransactionId = gmailTransactionIds[Math.floor(Math.random()*gmailTransactionIds.length)];
                const newTransactionData = gmailTransactionTestHelper.resolveTransactionData(randomTransactionId);
                newTransactionData.reference = transaction.reference;
                const newTransactionPaymentDetails = gmailTransactionTestHelper.resolvePaymentDetails(randomTransactionId);
                const newTransaction = TransactionFactory.create(transaction.id, newTransactionData, newTransactionPaymentDetails);

                return newTransaction;
            })

        const transactionsResponse = updatedTransactions.map(TransactionExtensions.toResponse);

        const response = await apiClient.patch(`/api/transactions/update`, transactionsResponse);

        const date = transactions
            .map(t => t.date)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        date.setSeconds(date.getSeconds()+1);
        const persistedTransactions = await transactionRepository.filterAsync(null, null, date, transactions.length, [], [], null, null, null, null);
        const sortedPersistedTransactions = persistedTransactions.sort((a, b) => a.id.localeCompare(b.id));

        const updatedTransactionIds = updatedTransactions.map(t => t.id);
        const expectedTransactions = transactions
            .map(transaction =>
                updatedTransactionIds.indexOf(transaction.id) == -1
                    ? transaction
                    : updatedTransactions.filter(t => t.id === transaction.id).at(0)!)
            .sort((a, b) => a.id.localeCompare(b.id));

        expect(response.status).toEqual(204);

        expect(sortedPersistedTransactions).toEqual(expectedTransactions);
    });
}