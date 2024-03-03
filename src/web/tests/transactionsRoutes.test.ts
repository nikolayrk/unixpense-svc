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
import { TransactionTypeExtensions } from '../../core/extensions/transactionTypeExtensions';
import { EntryTypeExtensions } from '../../core/extensions/entryTypeExtensions';
import { gmailPaymentDetailsTestCases } from '../../gmail/types/gmailPaymentDetailsTestCases';
import CardOperation from '../../core/types/cardOperation';
import StandardTransfer from '../../core/types/standardTransfer';
import PaymentDetails from '../../core/types/paymentDetails';
import Transaction from '../../core/types/transaction';
import TransactionTestHelper from '../../core/utils/transactionTestHelper';

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

    it('should fail to query transactions due to passing an invalid fromDate value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid fromDate value: xxx" };

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
    });

    it('should fail to query transactions due to passing an invalid toDate value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions?toDate=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid toDate value: xxx" };

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
    });

    it('should fail to query transactions due to passing an invalid since value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions?since=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid since value: xxx" };

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
    });

    it('should fail to query transactions due to passing an invalid count value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions?count=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid count value: xxx" };

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
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

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
    });

    it('should fail to query transactions due to passing an invalid sum value', async () => {
        const date = new Date();
        const dateQuery = date.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?fromDate=${dateQuery}&toDate=${dateQuery}&fromSum=xxx`)
            .set('Accept', 'application/json')
            .send();

        const expected = { error: "Invalid sum value: xxx" };

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
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

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
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

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
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

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected)
    });

    it('should persist a random number of transactions then query them back by date', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);
        
        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const date = transactions
            .map(t => t.valueDate)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        const dateQuery = date.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}&fromDate=${dateQuery}&toDate=${dateQuery}`)
            .set('Accept', 'application/json')
            .send();
        
        const expected = transactions.map(TransactionExtensions.toResponse);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist a random number of transactions then query them back by since date', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);
        
        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const date = new Date(transactions
            .map(t => t.date)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!);
        date.setSeconds(date.getSeconds()+1);
        const dateQuery = date.toISOString();

        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}&since=${dateQuery}`)
            .set('Accept', 'application/json')
            .send();
        
        const expected = transactions.map(TransactionExtensions.toResponse);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist a random number of transactions then query back an empty array per since date', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);
        
        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const date = transactions
            .map(t => t.date)
            .sort((first: Date, second: Date) => first.getTime() - second.getTime())
            .at(0)!;
        const dateQuery = date.toQuery();

        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}&since=${dateQuery}`)
            .set('Accept', 'application/json')
            .send();
        
        const expected = [];

        expect(response.body).toEqual(expected)
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
    });

    it('should persist a random number of transactions then query them back by sum', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);

        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const sum = transactions
            .map(t => Number(t.sum))
            .sort((first: number, second: number) => first - second)
            .at(0) as number;
            
        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}&fromSum=${sum}&toSum=${sum}`)
            .set('Accept', 'application/json')
            .send();
            
        const expected = transactions.map(TransactionExtensions.toResponse);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist a random number of transactions then query them back by type', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);

        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const types = transactions
            .map(t => t.type)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => TransactionTypeExtensions.toOrdinalEnum(String(t)));
        const typesQuery = types
            .map(t => `&types=${t}`)
            .join('');

        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}${typesQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions.map(TransactionExtensions.toResponse);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist a random number of transactions then query them back by entryType', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);

        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
        const entryTypes = transactions
            .map(t => t.entryType)
            .filter((t, i, a) => a.indexOf(t) === i)
            .map(t => EntryTypeExtensions.toOrdinalEnum(String(t)));
        const entryTypesQuery = entryTypes
            .map(t => `&entryTypes=${t}`)
            .join('');

        const response = await supertest.agent(app)
            .get(`/api/transactions?count=${transactions.length}&${entryTypesQuery}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions.map(TransactionExtensions.toResponse);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist a random number of transactions then query them back by recipient', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);

        const _ = await transactionRepository.bulkCreateAsync(transactions);
        
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
            .get(`/api/transactions?count=${transactions.length}&recipient=${encodeURIComponent(recipientQuery)}`)
            .set('Accept', 'application/json')
            .send();

        const expected = transactions
            .filter(t => t.paymentDetails.recipient !== Constants.defaultPaymentDetails.recipient)
            .map(TransactionExtensions.toResponse);
    
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toEqual(expected.length);
        expected.forEach(e => expect(response.body.map(r => r.id)).toContainEqual(e.id));
    });

    it('should persist all valid transactions then query each one back by description', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .resolveTransactionsAsync(transactionProvider);

        const resolveDescription = (t: Transaction<PaymentDetails>) =>
            TransactionTypeExtensions.isCardOperation(t.type)
                ? (<CardOperation>t.paymentDetails).instrument
                : (<StandardTransfer>t.paymentDetails).description;

        const filteredTransactions = transactions
                .filter(t => resolveDescription(t) !== undefined &&
                             resolveDescription(t) !== "" &&
                             resolveDescription(t) !== "N/A")

        const _ = await transactionRepository.bulkCreateAsync(filteredTransactions);

        await Promise.all(filteredTransactions
            .map(async t => {
                const description = resolveDescription(t);
                const descriptionQuery = encodeURIComponent(`"${String(description)}"`);

                const response = await supertest.agent(app)
                    .get(`/api/transactions?description=${descriptionQuery}`)
                    .set('Accept', 'application/json')
                    .send();

                const expected = TransactionExtensions.toResponse(t);

                expect(response.statusCode).toBe(200);
                expect(response.headers["content-type"]).toMatch(/json/);
                expect(response.body.map(r => r.id)).toContainEqual(expected.id);
            }));
    });

    it('should persist a random number of transactions', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);
                    
        const transactionsResponse = transactions.map(TransactionExtensions.toResponse);

        const response = await supertest.agent(app)
            .post(`/api/transactions/save`)
            .set('Accept', 'application/json')
            .send(transactionsResponse);

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));

        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));
        const added = expectedTransactionIds.length;

        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
    });

    it('should persist a random number of transactions and skip a portion', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .randomCount()
            .resolveTransactionsAsync(transactionProvider);
        
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

        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
    });
});