import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { defineDatabaseModels, registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { clearDatabaseAsync, createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/utils/databaseContainerUtils';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize-typescript';
import Constants from '../../constants';
import TransactionRepository from '../../core/repositories/transactionRepository';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';
import { randomiseTransactionIds, resolveRandomNumberOfTransactionIds, resolveTransactionIds, resolveTransactionsAsync } from '../../core/utils/transactionUtils';
import { TransactionTypeExtensions } from '../../core/extensions/transactionTypeExtensions';
import { EntryTypeExtensions } from '../../core/extensions/entryTypeExtensions';
import { gmailPaymentDetailsTestCases } from '../../gmail/types/gmailPaymentDetailsTestCases';
import CardOperation from '../../core/types/cardOperation';
import StandardTransfer from '../../core/types/standardTransfer';

describe('Base Transactions Routes Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let app: Server;

    let transactionRepository: TransactionRepository;
    let transactionProvider: ITransactionProvider;
    
    beforeAll(async () => {
        process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
        process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;

        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});
        
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
        
        container = await createMariaDbContainerAsync();
        connection = await createContainerDatabaseConnectionAsync(container);
        await defineDatabaseModels(connection);
        app = await startServerAsync();
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await stopServerAsync(app);
        await connection.close();
        await container.stop();
    });

    beforeEach(async () => {
        await clearDatabaseAsync(connection);
    });

    it('should fail to query transactions due to passing an invalid date', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=xxx&toDate=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid date value: xxx / xxx" };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should fail to query transactions due to passing an invalid date range', async () => {
        const fromDate = new Date();
        const toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() - 1);

        const fromDateQuery = fromDate.toQuery();
        const toDateQuery = toDate.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${fromDateQuery}&toDate=${toDateQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: `Invalid date range: ${fromDate.toResponse()} - ${toDate.toResponse()}` };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should fail to query transactions due to passing an invalid sum value', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid sum value: xxx" };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should fail to query transactions due to passing an invalid sum range', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const fromSum = 3;
        const toSum = 2;

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=${fromSum}&toSum=${toSum}`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: `Invalid sum range: ${fromSum} - ${toSum}` };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should fail to query transactions due to passing an invalid type', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const typeQuery = 'xxx';

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&types=${typeQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: `Invalid types value: ${typeQuery}` };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should fail to query transactions due to passing an invalid entryType', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();
        const entryTypeQuery = 'xxx';

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&entryTypes=${entryTypeQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: `Invalid entryTypes value: ${entryTypeQuery}` };

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by date', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));
        
        const _ = await transactionRepository.bulkCreateAsync(transactions);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        const dateQuery = date.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}`)
            .set('Accept', 'application/json')
            .send();
        
        const expected = transactions
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(TransactionExtensions.toResponse);

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by sum', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));

        const _ = await transactionRepository.bulkCreateAsync(transactions);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0) as Date;
        const dateQuery = date.toQuery();
        const sum = transactions
            .map(t => Number(t.sum))
            .sort((first: number, second: number) => first - second)
            .at(0) as number;
            
        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=${sum}&toSum=${sum}`)
            .set('Accept', 'application/json')
            .send();
            
        const expected = transactions
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(TransactionExtensions.toResponse);
            
        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by type', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));

        const _ = await transactionRepository.bulkCreateAsync(transactions);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0) as Date;
        const dateQuery = date.toQuery();
        const types = transactions
            .map(t => t.type)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => TransactionTypeExtensions.toOrdinalEnum(String(t)));
        const typesQuery = types
            .map(t => `&types=${t}`)
            .join('');

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}${typesQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(TransactionExtensions.toResponse);

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by entryType', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));

        const _ = await transactionRepository.bulkCreateAsync(transactions);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0) as Date;
        const dateQuery = date.toQuery();
        const entryTypes = transactions
            .map(t => t.entryType)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => EntryTypeExtensions.toOrdinalEnum(String(t)));
        const entryTypesQuery = entryTypes
            .map(t => `&entryTypes=${t}`)
            .join('');

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}${entryTypesQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(TransactionExtensions.toResponse);

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by recipient', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));

        const _ = await transactionRepository.bulkCreateAsync(transactions);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0) as Date;
        const dateQuery = date.toQuery();
        const recipientQuery = transactions
            .map(t => t.paymentDetails.recipient)
            .reduce((acc, curr) => {
                if(!acc.includes(curr)) {
                    acc.push(curr);
                }
                return acc;
            }, [] as string[])
            .filter(r => r !== Constants.defaultPaymentDetails.recipient)
            .join(' ');

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&recipient=${encodeURIComponent(recipientQuery)}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions
            .filter(t => t.paymentDetails.recipient !== Constants.defaultPaymentDetails.recipient)
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(TransactionExtensions.toResponse);

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random transaction then query it back by description', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                resolveRandomNumberOfTransactionIds(
                    randomiseTransactionIds(
                        resolveTransactionIds(gmailPaymentDetailsTestCases))));

        const selectedTransaction = transactions
            .filter(t => t.paymentDetails !== Constants.defaultPaymentDetails)
            .at(0)!;

        const _ = await transactionRepository.bulkCreateAsync([selectedTransaction]);
                    
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0) as Date;
        const dateQuery = date.toQuery();
        const descriptionQuery = TransactionTypeExtensions.isCardOperation(selectedTransaction.type)
            ? (<CardOperation>selectedTransaction.paymentDetails).instrument
            : (<StandardTransfer>selectedTransaction.paymentDetails).description;

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&description=${encodeURIComponent(String(descriptionQuery))}`)
            .set('Accept', 'application/json')
            .send();

        const expected = [TransactionExtensions.toResponse(selectedTransaction)];

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                randomiseTransactionIds(
                    resolveTransactionIds(gmailPaymentDetailsTestCases)));
                    
        const transactionsResponse = transactions.map(TransactionExtensions.toResponse);

        const response = await supertest.agent(app)
            .post(`/api/transactions/save`)
            .set('Accept', 'application/json')
            .send(transactionsResponse);

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));

        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));
        const added = expectedTransactionIds.length;

        expect(actualTransactionIds).toEqual(expectedTransactionIds);
        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions and skip a portion', async () => {
        const transactions = await
            resolveTransactionsAsync(transactionProvider,
                randomiseTransactionIds(
                    resolveTransactionIds(gmailPaymentDetailsTestCases)));
        
        const existingTransactionsCount = Math.floor(Math.random() * (transactions.length - 1) + 1);

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));
                    
        const transactionsResponse = transactions.map(TransactionExtensions.toResponse);

        const response = await supertest.agent(app)
            .post(`/api/transactions/save`)
            .set('Accept', 'application/json')
            .send(transactionsResponse);

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));
        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));
        const added = transactions.length - existingTransactionsCount;

        expect(actualTransactionIds).toEqual(expectedTransactionIds);
        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
    });
});