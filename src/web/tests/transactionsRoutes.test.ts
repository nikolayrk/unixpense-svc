import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { clearDatabaseAsync, createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/tests/helpers';
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
import { randomiseTransactionIds, resolveTransactionIds, resolveTransactionsAsync } from '../../gmail/utils/randomTransactionsUtils';

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

    it('should persist a random number of transactions', async () => {
        const transactions = await resolveTransactionsAsync(transactionProvider, randomiseTransactionIds(resolveTransactionIds()));
        const transactionsResponse = transactions.map(t => TransactionExtensions.toResponse(t));

        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));

        const response = await supertest.agent(app)
            .post(`/api/transactions/save`)
            .set('Accept', 'application/json')
            .send(transactionsResponse);

        const added = expectedTransactionIds.length;

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));

        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });

    it('should persist a random number of transactions and skip a portion', async () => {
        const transactions = await resolveTransactionsAsync(transactionProvider, randomiseTransactionIds(resolveTransactionIds()));
        const transactionsResponse = transactions.map(t => TransactionExtensions.toResponse(t));
        
        const existingTransactionsCount = Math.floor(Math.random() * (transactions.length - 1) + 1);
        const expectedTransactionIds = transactions.map(t => t.id).sort((a, b) => a.localeCompare(b));

        await transactionRepository.bulkCreateAsync(transactions.slice(0, existingTransactionsCount));

        const response = await supertest.agent(app)
            .post(`/api/transactions/save`)
            .set('Accept', 'application/json')
            .send(transactionsResponse);

        const added = transactions.length - existingTransactionsCount;

        const persistedTransactionIds = await transactionRepository.getAllIdsAsync();
        const actualTransactionIds = persistedTransactionIds.sort((a, b) => a.localeCompare(b));

        expect(response.body).toEqual({ message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`})
        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(actualTransactionIds).toEqual(expectedTransactionIds);
    });
});