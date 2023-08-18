import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import { registerDependencies } from '../../bootstrap';
import { clearDatabaseAsync, createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../tests/helpers';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer } from 'testcontainers';
import { Sequelize } from 'sequelize-typescript';
import GoogleOAuth2TokensRepository from '../../googleOAuth2/repositories/googleOAuth2TokensRepository';
import TransactionRepository from '../../core/repositories/transactionRepository';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import Constants from '../../constants';
import { resolveRandomTransactionsAsync } from '../../gmail/utils/randomTransactionsUtils';

describe('Transaction Repository Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;

    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;
    let transactionRepository: TransactionRepository;
    let transactionProvider: ITransactionProvider;

    beforeAll(async () => {
        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});
        
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve(injectables.GoogleOAuth2TokensRepository);
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
        
        container = await createMariaDbContainerAsync();
        connection = await createContainerDatabaseConnectionAsync(container);
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await connection.close();
        await container.stop();
    });

    beforeEach(async () => {
        await clearDatabaseAsync(connection);        
    });

    it('should throw a repository error', async () => {
        const transactions = await resolveRandomTransactionsAsync(transactionProvider);

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