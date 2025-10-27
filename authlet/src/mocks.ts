import nock from "nock";
import Constants from "@shared/constants";

const oauth2ApiBaseUrl = 'https://oauth2.googleapis.com';

const tokenUri = '/token';
const tokenInfoUri = '/tokeninfo';

export const applyGoogleMocksAsync = async () => {
    const oauth2Scope = nock(oauth2ApiBaseUrl);
    
    oauth2Scope
        .post(tokenUri, () => true)
        .reply(oauth2TokenCallback)
        .persist();
    
    oauth2Scope
        .post(tokenInfoUri, () => true)
        .reply(200, {
            scope: Constants.scopes.join(' '),
            email: Constants.Mock.userEmail,
        })
        .persist();
    }

const oauth2TokenCallback = (uri: string, requestBody: nock.Body) => {
    const code = new URLSearchParams(requestBody).get('code');

    if (code === Constants.Mock.authorizationCodeError) {
        return [500, {
            error: code,
            error_description: code,
        }];
    }

    return [200, {
        access_token: Constants.Mock.accessToken,
        refresh_token: Constants.Mock.refreshToken,
        redirect_uri: Constants.defaultRedirectUri,
    }];
};