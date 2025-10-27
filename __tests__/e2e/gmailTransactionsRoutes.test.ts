import { describe } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { injectables } from '../../src/core/types/injectables';
import Constants from '@shared/constants';
import TransactionRepository from '../../src/core/repositories/transactionRepository';
import { gmailTransactionsRoutesCases } from '../cases/gmailTransactionsRoutesCases';
import { ApiClient } from '../helpers/apiClient';
import appTestBase from '../helpers/appTestBase';
import { resolveOAuth2CookieAsync } from '../helpers/resolveOAuth2Cookie';

describe('Gmail Transactions Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);
    let transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);
    
    appTestBase({ authorizeMockUser: true, beforeAllAppendix: async () => {
        const oauth2Cookie = await resolveOAuth2CookieAsync();
        
        apiClient.withCookieAuth(oauth2Cookie);
    }});

    gmailTransactionsRoutesCases(apiClient, transactionRepository);
});