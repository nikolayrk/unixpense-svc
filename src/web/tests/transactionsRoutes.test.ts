import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { createDatabaseConnectionAsync, registerDependencies, startServerAsync } from '../../bootstrap';
import ILogger from '../../core/contracts/ILogger';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { paymentDetailsTestCases } from '../../gmail/types/paymentDetailsTestCases';
import Constants from '../../constants';
import * as mariadb from 'mariadb';
import TransactionRepository from '../../core/repositories/transactionRepository';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import Transaction from '../../core/models/transaction';
import PaymentDetails from '../../core/models/paymentDetails';
import { TransactionExtensions } from '../../core/extensions/transactionExtensions';

describe('Base Transactions Routes Tests', () => {
    const mariadbPort = 3306;
    const mariadbUser = 'root';
    const mariadbPassword = 'password';
    const mariadbDatabase = 'unixpense;'
    const beforeAllTimeout = 30 * 1000; // 30s

    let mariadbHost: string;
    let mariadbMappedPort: number;

    let logger: ILogger;
    let transactionRepository: TransactionRepository;
    let transactionProvider: ITransactionProvider;

    let container: StartedTestContainer | null = null;
    let connection: Sequelize | null = null;
    let app: Server | null = null;

    beforeAll(async () => {
        process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
        process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;

        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});
        
        logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
        
        container = await new GenericContainer("mariadb")
            .withEnvironment({ "MARIADB_ROOT_PASSWORD": mariadbPassword })
            .withExposedPorts(mariadbPort)
            .withWaitStrategy(Wait.forLogMessage("mariadbd: ready for connections.", 1))
            .start();

        mariadbHost = container.getHost();
        mariadbMappedPort = container.getMappedPort(mariadbPort);
        
        connection = await createDatabaseConnectionAsync(
            mariadbHost,
            mariadbMappedPort,
            mariadbUser,
            mariadbPassword,
            mariadbDatabase,
            logger);
            
        const port = Math.round(Math.random() * (65535 - 1024) + 1024);

        app = await startServerAsync(port);
    }, beforeAllTimeout);
    
    afterAll(async () => {
        app?.close();

        await connection?.close();
        
        await container?.stop();
    });

    beforeEach(async () => {
        await clearDatabaseAsync();
    });

    const clearDatabaseAsync = async () => {
        const pool = mariadb.createPool({
            host: mariadbHost,
            port: mariadbMappedPort,
            user: mariadbUser,
            password: mariadbPassword,
            database: mariadbDatabase,
            multipleStatements: true
        });
    
        const conn = await pool.getConnection();
    
        await conn.query([
                'card_operations',
                'standard_transfers',
                'transactions'
           ].map(table => `DELETE FROM ${table};`)
            .join(''));
    
        await conn.release();
    
        await pool.end();
    }

    const resolveRandomTransactionIds = () => {
        const allTransactionIds = Object.keys(paymentDetailsTestCases).filter(k => isNaN(Number(k)));
        const count = Math.random() * (allTransactionIds.length - 1) + 1;
        const transactionIds = allTransactionIds.splice(0, count);
        
        return transactionIds;
    };

    const resolveRandomTransactionsAsync = () => {
        const transactionIds = resolveRandomTransactionIds();

        const transactions = transactionIds
            .map(async (transactionId: string) => {
                const transaction = await transactionProvider.resolveTransactionAsync(transactionId);
                
                return transaction;
            })
            .reduce(async (accumulator, current, i) => {
                const currentValue = await current;

                if (currentValue === null) {
                    return accumulator;
                }
                
                const accumulatorValue = await accumulator;

                accumulatorValue.push(currentValue);

                return accumulator;
            }, Promise.resolve([] as Transaction<PaymentDetails>[]));

        return transactions;
    };

    it('should persist a random number of transactions', async () => {
        const transactions = await resolveRandomTransactionsAsync();
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
        const transactions = await resolveRandomTransactionsAsync();
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