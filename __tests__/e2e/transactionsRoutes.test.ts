import { describe } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { injectables } from '../../src/core/types/injectables';
import Constants from '../../shared/constants';
import TransactionRepository from '../../src/core/repositories/transactionRepository';
import appTestBase from '../helpers/appTestBase';
import { resolveOAuth2CookieAsync } from '../helpers/resolveOAuth2Cookie';
import { ApiClient } from '../helpers/apiClient';
import { transactionsRoutesCases } from '../cases/transactionsRoutesCases';

describe('Base Transactions Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);
    let transactionRepository: TransactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);

    appTestBase({ beforeAllAppendix: async () => {
        const oauth2Cookie = await resolveOAuth2CookieAsync();
        
        apiClient.withCookieAuth(oauth2Cookie);
    }});

    transactionsRoutesCases(apiClient, transactionRepository);
});
