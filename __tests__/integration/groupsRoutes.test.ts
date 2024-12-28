import { describe, it, expect } from '@jest/globals';
import appTestBase from '../helpers/appTestBase';
import Constants from '@shared/constants';
import { ApiClient } from '../helpers/apiClient';
import { groupsRoutesCases } from '../cases/groupsRoutesCases';

describe('Groups Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);

    appTestBase();

    groupsRoutesCases(apiClient);
});