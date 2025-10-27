import { expect, it } from "@jest/globals";
import { ApiClient } from "../helpers/apiClient";
import { AxiosError } from "axios";
import Constants from "@shared/constants";

export const googleOAuth2RoutesCases = (apiClient: ApiClient) => {
    it('should have credentials', async () => {
        const promise = apiClient.post('/google/callback');

        await expect(promise).rejects.toThrow('Request failed with status code 401');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { message: "No credentials provided" }
            }
        });
    });

    it('should have valid credentials', async () => {
        const promise = apiClient.post('/google/callback', {
                client_id: "not_client_id",
                client_secret: "not_client_secret",
                redirect_uri: "not_redirect_uri",
                code: Constants.Mock.authorizationCode
            });

        await expect(promise).rejects.toThrow('Request failed with status code 401');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { message: "Invalid credentials" }
            }
        });
    });

    it('should have an authorization code', async () => {
        const promise = apiClient.post('/google/callback', {
            client_id: Constants.Mock.clientId,
            client_secret: Constants.Mock.clientSecret,
            redirect_uri: Constants.Mock.redirectUri
        });

        await expect(promise).rejects.toThrow('Request failed with status code 403');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_REQUEST,
            response: {
                data: { message: "No authorization code provided" }
            }
        });
    });

    it('should refresh access token', async () => {
        await apiClient.post('/google/callback', {
            client_id: Constants.Mock.clientId,
            client_secret: Constants.Mock.clientSecret,
            redirect_uri: Constants.Mock.redirectUri,
            code: Constants.Mock.authorizationCode
        });
        
        const response = await apiClient.put('/google/refresh-token', {
            access_token: Constants.Mock.accessToken
        });

        expect(response).toMatchObject({
            status: 200,
                data: {
                    access_token: Constants.Mock.accessToken
                }
            });
    });

    it('should handle authorization errors', async () => {
        await process.nextTick(() => {}); // https://stackoverflow.com/q/69169492
        const promise = apiClient.post('/google/callback', {
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri,
                code: Constants.Mock.authorizationCodeError
            });

        await expect(promise).rejects.toThrow('Request failed with status code 500');
        await expect(promise).rejects.toMatchObject({
            code: AxiosError.ERR_BAD_RESPONSE,
            response: {
                data: { message: `Authorization failed: Axios error encountered during authorization: ${Constants.Mock.authorizationCodeError} (${Constants.Mock.authorizationCodeError})` }
            }
        });
    });
}