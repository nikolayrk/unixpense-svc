import { describe, it, expect } from '@jest/globals';
import appTestBase from '../helpers/appTestBase';
import Constants from '@shared/constants';
import { ApiClient } from '../helpers/apiClient';
import { groupsRoutesCases } from '../cases/groupsRoutesCases';
import { resolveOAuth2CookieAsync } from '../helpers/resolveOAuth2Cookie';

describe('Groups Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);

    appTestBase({ beforeAllAppendix: async () => {
        const oauth2Cookie = await resolveOAuth2CookieAsync();
        
        apiClient.withCookieAuth(oauth2Cookie);
    }});

    groupsRoutesCases(apiClient);
});