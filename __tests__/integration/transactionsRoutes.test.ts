import { describe } from '@jest/globals';
import { DependencyInjector } from '../../src/dependencyInjector';
import { injectables } from '../../src/core/types/injectables';
import Constants from '@shared/constants';
import TransactionRepository from '../../src/core/repositories/transactionRepository';
import appTestBase from '../helpers/appTestBase';
import { ApiClient } from '../helpers/apiClient';
import { transactionsRoutesCases } from '../cases/transactionsRoutesCases';

describe('Base Transactions Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);
    let transactionRepository = DependencyInjector.Singleton.resolve<TransactionRepository>(injectables.TransactionRepository);

    appTestBase();

    transactionsRoutesCases(apiClient, transactionRepository);
});
