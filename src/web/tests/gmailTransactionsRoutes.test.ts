import { describe, it, beforeAll, afterAll, expect, beforeEach } from '@jest/globals';
import * as supertest from 'supertest';
import { registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { clearDatabaseAsync, createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/tests/helpers';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize-typescript';
import Constants from '../../constants';
import GoogleOAuth2TokensRepository from '../../googleOAuth2/repositories/googleOAuth2TokensRepository';
import TransactionRepository from '../../core/repositories/transactionRepository';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import Transaction from '../../core/models/transaction';
import PaymentDetails from '../../core/models/paymentDetails';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';
import { resolveRandomNumberOfTransactionIds, resolveTransactionsAsync, resolveTransactionIds, randomiseTransactionIds } from '../../gmail/utils/randomTransactionsUtils';

describe('Gmail Transactions Routes Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let app: Server;
    
    let transactionProvider: ITransactionProvider;
    let transactionRepository: TransactionRepository;
    
    beforeAll(async () => {
        process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
        process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;

        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});

        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        
        container = await createMariaDbContainerAsync();
        connection = await createContainerDatabaseConnectionAsync(container);
        app = await startServerAsync();

        await DependencyInjector.Singleton
            .resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository)
            .createOrUpdateAsync(Constants.Mock.userEmail, Constants.Mock.accessToken, Constants.Mock.refreshToken);
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await stopServerAsync(app);
        await connection.close();
        await container.stop();
    });

    beforeEach(async () => {
        await clearDatabaseAsync(connection);
    });

    it('should error out with a missing access token', async () => {
        const response = await supertest.agent(app)
            .get("/api/transactions/gmail/ids/last/1")
            .set('Accept', 'application/json')
            .send([]);

        expect(response.statusCode).toBe(401);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "No access token provided" });
    });

    it('should error out with an invalid last value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/xxx`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send([]);

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "Invalid last amount provided: xxx" });
    });

    it('should error out with a negative last value', async () => {
        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/-1`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "Invalid last amount provided: -1" });
    });

    it('should error out with an invalid skip depth value', async () => {
        const transactionIds = resolveRandomNumberOfTransactionIds(resolveTransactionIds());

        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=xxx`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "Invalid skip depth provided: xxx" });
    });

    it('should error out with a negative skip depth value', async () => {
        const transactionIds = resolveRandomNumberOfTransactionIds(resolveTransactionIds());

        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/${transactionIds.length}?skip_depth=-1`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "Invalid skip depth provided: -1" });
    });

    it('should fetch a random number of transaction IDs', async () => {
        const expectedTransactionIds = resolveRandomNumberOfTransactionIds(resolveTransactionIds());

        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/${expectedTransactionIds.length}`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();

        const actualTransactionIds = response.body;

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    it('should fetch a random number of transaction IDs and skip a portion', async () => {
        const transactions = await resolveTransactionsAsync(transactionProvider, resolveRandomNumberOfTransactionIds(resolveTransactionIds()));
        const halfwayPoint = Math.floor(transactions.length / 2);
        const existingTransactionsCount = Math.floor(Math.random() * (halfwayPoint - 1) + 1);
        const skipDepth = existingTransactionsCount + 1;

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));

        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();
        
        const expectedTransactionIds = transactions.slice(existingTransactionsCount).map(t => t.id);
        const actualTransactionIds = response.body;

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    it('should fetch an empty array after entering skip depth constraints', async () => {
        const transactions = await resolveTransactionsAsync(transactionProvider, resolveRandomNumberOfTransactionIds(resolveTransactionIds()));
        const halfwayPoint = Math.ceil(transactions.length / 2);
        const existingTransactionsCount = Math.floor(Math.random() * (halfwayPoint - 1) + 1);
        const skipDepth = existingTransactionsCount;

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));

        const response = await supertest.agent(app)
            .get(`/api/transactions/gmail/ids/last/${transactions.length}?skip_saved=true&skip_depth=${skipDepth}`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send();
        
        const expectedTransactionIds: Transaction<PaymentDetails>[] = []
        const actualTransactionIds = response.body;

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    // TODO: test throwing error when fetching transaction IDs (somehow)

    it('should error out while trying to resolve a transaction', async () => {
        const response = await supertest.agent(app)
            .post(`/api/transactions/gmail/resolve`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send([ Constants.Mock.errorTransactionSourceId ]);

        expect(response.statusCode).toBe(500);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: Constants.Mock.errorTransactionSourceId });
    });

    it('should resolve a random number of transactions', async () => {
        const transactions = await resolveTransactionsAsync(transactionProvider, randomiseTransactionIds(resolveRandomNumberOfTransactionIds(resolveTransactionIds())));
        const transactionIds = transactions.map(t => t.id);

        const response = await supertest.agent(app)
            .post(`/api/transactions/gmail/resolve`)
            .auth(Constants.Mock.accessToken, { type: "bearer" })
            .set('Accept', 'application/json')
            .send(transactionIds);

        const expected = transactions
            .map(t => TransactionExtensions.toResponse(t));

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual(expected);
    });
});