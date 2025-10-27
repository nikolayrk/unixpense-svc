import { describe } from '@jest/globals';
import Constants from '@shared/constants';
import appTestBase from '../helpers/appTestBase';
import { googleOAuth2RoutesCases } from '../cases/googleOAuth2RoutesCases';
import { ApiClient } from '../helpers/apiClient';

describe('Google OAuth2 Routes Tests', () => {
    let apiClient = new ApiClient(Constants.Defaults.authletUrl);

    appTestBase();
    
    googleOAuth2RoutesCases(apiClient);
});
