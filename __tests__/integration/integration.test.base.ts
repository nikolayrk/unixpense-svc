import { afterAll, beforeAll, beforeEach } from '@jest/globals';
import axios from 'axios';
import { DependencyInjector } from '../../src/dependencyInjector';
import { createDatabaseConnectionAsync, defineDatabaseModels } from '../../src/bootstrap';
import Constants from '../../src/constants';
import { Sequelize } from 'sequelize-typescript';
import Transaction from '../../src/core/models/transaction.model';
import GoogleOAuth2Tokens from '../../src/googleOAuth2/models/googleOAuth2Tokens.model';

const integrationTestBase = (options?: {
    skipDefineDatabaseModels?: boolean,
    beforeAllAppendix?: (sequelize: Sequelize) => void | Promise<void>,
}) => {
    let connection: Sequelize;
    
    beforeAll(async () => {
        DependencyInjector.Singleton.registerGmailServices();
        
        connection = await createDatabaseConnectionAsync(
            Constants.Defaults.mariadbHost,
            Constants.Defaults.mariadbPort,
            Constants.Defaults.mariadbUser,
            Constants.Defaults.mariadbPassword,
            Constants.Defaults.mariadbDatabase
        );
        
        if (options?.skipDefineDatabaseModels === undefined || options?.skipDefineDatabaseModels === false) {
            await defineDatabaseModels(connection, true);
        }
        
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

export default integrationTestBase;