import { describe, it, expect } from '@jest/globals';
import appTestBase from '../helpers/appTestBase';
import Constants from '@shared/constants';
import { ApiClient } from '../helpers/apiClient';
import { groupRulesRoutesCases } from '../cases/groupRulesRoutesCases';

describe('Group Rules Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);

    appTestBase();

    groupRulesRoutesCases(apiClient);
});