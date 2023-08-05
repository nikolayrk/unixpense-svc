import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import { createDatabaseConnectionAsync, registerDependencies } from '../../bootstrap';
import ILogger from '../../core/contracts/ILogger';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { Sequelize } from 'sequelize';
import * as mariadb from 'mariadb';
import GoogleOAuth2TokensRepository from '../../googleOAuth2/repositories/googleOAuth2TokensRepository';
import TransactionRepository from '../../core/repositories/transactionRepository';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import { paymentDetailsTestCases } from '../../gmail/types/paymentDetailsTestCases';
import Transaction from '../models/transaction';
import PaymentDetails from '../models/paymentDetails';

describe('Transaction Repository Tests', () => {
    const mariadbPort = 3306;
    const mariadbUser = 'root';
    const mariadbPassword = 'password';
    const mariadbDatabase = 'unixpense;'
    const beforeAllTimeout = 30 * 1000; // 30s

    let mariadbHost: string;
    let mariadbMappedPort: number;

    let logger: ILogger;
    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;
    let transactionRepository: TransactionRepository;
    let transactionProvider: ITransactionProvider;

    let container: StartedTestContainer | null = null;
    let connection: Sequelize | null = null;

    beforeAll(async () => {
        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});
        
        logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve(injectables.GoogleOAuth2TokensRepository);
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
    }, beforeAllTimeout);
    
    afterAll(async () => {
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

    const resolveTransactionsAsync = () => {
        const transactionIds = Object.keys(paymentDetailsTestCases).filter(k => isNaN(Number(k)));

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

    it('should throw a repository error', async () => {
        const transactions = await resolveTransactionsAsync();

        const first = await transactionRepository.bulkCreateAsync(transactions);

        let second: number | null = null;

        try {
            second = await transactionRepository.bulkCreateAsync(transactions);
        } catch(ex) {
            const error = ex as Error;

            expect(error.name).toBe('RepositoryError');
            expect(error.message).toMatch(/Validation error: SequelizeUniqueConstraintError \(Duplicate entry '(?:\w+)' for key '(?:\w+)'\)/);
        }

        expect(second).toBe(null);
    });
});