import { describe, it, expect } from '@jest/globals';
import Constants from '@shared/constants';
import { DependencyInjector } from '../../src/dependencyInjector';
import GoogleOAuth2TokensRepository from '../../src/googleOAuth2/repositories/googleOAuth2TokensRepository';
import { injectables } from '../../src/core/types/injectables';
import axios, { AxiosError, AxiosInstance } from 'axios';
import apiIntegrationTestBase from './integration.test.base';

describe('Google OAuth2 Routes Tests', () => {
    let apiClient: AxiosInstance;
    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;

    apiIntegrationTestBase({ beforeAllAppendix: () => {
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository);
        apiClient = axios.create({ baseURL: Constants.baseUrl });
    }});
    
    it('should have credentials', async () => {
        const promise = apiClient.post('/api/oauthcallback');

        await expect(promise).rejects.toThrow('Request failed with status code 401');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "No credentials provided" }
            }
        });
    });

    it('should have valid credentials', async () => {
        const promise = apiClient.post('/api/oauthcallback', {
                client_id: "not_client_id",
                client_secret: "not_client_secret",
                redirect_uri: "not_redirect_uri",
                code: Constants.Mock.authorizationCode
            });

        await expect(promise).rejects.toThrow('Request failed with status code 401');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "Mismatched credentials" }
            }
        });
    });

    it('should have an authorization code', async () => {
        const promise = apiClient.post('/api/oauthcallback', {
            client_id: Constants.Mock.clientId,
            client_secret: Constants.Mock.clientSecret,
            redirect_uri: Constants.Mock.redirectUri
        });

        await expect(promise).rejects.toThrow('Request failed with status code 403');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { error: "No authorization code provided" }
            }
        });
    });

    it('should update persisted oauth2 refresh tokens', async () => {
        await googleOAuth2TokensRepository.createOrUpdateAsync(Constants.Mock.userEmail, Constants.Mock.accessToken, "old_refresh_token");

        const response = await apiClient.post('/api/oauthcallback', {
            client_id: Constants.Mock.clientId,
            client_secret: Constants.Mock.clientSecret,
            redirect_uri: Constants.Mock.redirectUri,
            code: Constants.Mock.authorizationCode
        });
        
        // Wait for 'tokens' event...
        await new Promise((r) => setTimeout(r, 100));

        const tokens = await googleOAuth2TokensRepository.getOrNullAsync(Constants.Mock.userEmail);

        expect(response).toMatchObject({
            status: 200,
            data: { 
                access_token: Constants.Mock.accessToken,
                refresh_token: Constants.Mock.refreshToken
            },
        });
        
        expect(tokens?.refreshToken).toEqual(Constants.Mock.refreshToken);
    });

    it('should handle authorization errors', async () => {
        await process.nextTick(() => {}); // https://stackoverflow.com/q/69169492
        const promise = apiClient.post('/api/oauthcallback', {
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri,
                code: Constants.Mock.authorizationCodeError
            });

        await expect(promise).rejects.toThrow('Request failed with status code 500');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_RESPONSE,
            response: {
                data: { error: `Axios error encountered during authorization: ${Constants.Mock.authorizationCodeError} (${Constants.Mock.authorizationCodeError})` }
            }
        });
    });
});
