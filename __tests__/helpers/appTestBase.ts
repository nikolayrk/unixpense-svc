import { afterAll, beforeAll, beforeEach } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { createDatabaseConnectionAsync, defineDatabaseModels } from '@shared/database';
import Constants from '@shared/constants';
import { Sequelize } from 'sequelize-typescript';
import Transaction from '../../src/core/models/transaction.model';
import GoogleOAuth2Tokens from '../../shared/models/googleOAuth2Tokens.model';

const appTestBase = (options?: {
    skipDefineDatabaseModels?: boolean,
    beforeAllAppendix?: (sequelize: Sequelize) => void | Promise<void>,
}) => {
    let connection: Sequelize;
    
    beforeAll(async () => {
        connection = await createDatabaseConnectionAsync();
        
        if (options?.skipDefineDatabaseModels !== true) {
            await defineDatabaseModels(connection, true);
        }
        
        DependencyInjector.Singleton.registerGmailServices();
        
        if (process.env.NODE_ENV === 'test_coverage') {
            const mocks = await import('../../src/mocks');

            mocks.applyLocalMocks();
        }

        await options?.beforeAllAppendix?.(connection);
    }, Constants.Defaults.containerTimeout);
    
    beforeEach(async () => {
        await GoogleOAuth2Tokens.sequelize?.sync({ force: true });
        await Transaction.sequelize?.sync({ force: true });
    });
    
    afterAll(async () => {
        await connection.close();
    });
};

export default appTestBase;