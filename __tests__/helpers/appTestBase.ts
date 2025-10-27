import { afterAll, beforeAll, beforeEach } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { createDatabaseConnectionAsync, defineDatabaseModels } from '@shared/database';
import Constants from '@shared/constants';
import { Sequelize } from 'sequelize-typescript';
import Transaction from '../../src/core/models/transaction.model';
import GoogleOAuth2Tokens from '../../shared/models/googleOAuth2Tokens.model';
import axios from 'axios';

const appTestBase = (options?: {
    skipDefineDatabaseModels?: boolean,
    authorizeMockUser?: boolean,
    beforeAllAppendix?: (sequelize: Sequelize) => void | Promise<void>,
}) => {
    let connection: Sequelize;
    
    beforeAll(async () => {
        connection = await createDatabaseConnectionAsync();
        
        if (options?.skipDefineDatabaseModels !== true) {
            await defineDatabaseModels(connection, true);
        }

        if (options?.authorizeMockUser === true) {
            const authletApiClient = axios.create({ baseURL: process.env.AUTHLET_API_URL || Constants.Defaults.authletUrl})
            
            await authletApiClient.post('/google/callback', {
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri,
                code: Constants.Mock.authorizationCode
            });
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