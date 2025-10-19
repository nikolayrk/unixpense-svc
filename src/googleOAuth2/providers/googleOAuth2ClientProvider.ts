import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import GoogleOAuth2Identifiers from '../types/googleOAuth2Identifiers';
import Constants from '../../constants';
import { DependencyInjector } from '../../dependencyInjector';
import ILogger from '../../core/contracts/ILogger';
import { injectables } from '../../core/types/injectables';
import GoogleOAuth2TokensRepository from '../repositories/googleOAuth2TokensRepository';
import IUsesGoogleOAuth2 from '../contracts/IUsesGoogleOAuth2';
import { injectable } from 'inversify';

class FetchError extends Error {
    type?: any;
    errno?: any;
}

@injectable()
export default class GoogleOAuth2ClientProvider implements IUsesGoogleOAuth2 {
    private readonly logger;
    private readonly googleOAuth2TokensRepository;

    private oauth2Client: OAuth2Client;

    public constructor() {
        this.logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        this.googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository);

        this.oauth2Client = null!;
    }

    public get client() {
        return this.oauth2Client;
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH2_CLIENT_ID,
            process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
            identifiers.redirectUri ?? Constants.defaultRedirectUri);

        this.oauth2Client.on('tokens', (tokens) => this.tryHandleTokensAsync(tokens));

        if (identifiers.accessToken !== undefined) {
            const tokens: Credentials = {
                scope: Constants.scopes.join(' '),
                token_type: "Bearer",
                access_token: identifiers.accessToken,
                refresh_token: identifiers.refreshToken
            };

            await this.tryHandleTokensAsync(tokens);
        }
    }

    public async tryAuthorizeAsync(code: string) {
        this.logger.log(`Received authorization request`, { authorization_code: code });

        try {
            const response = await this.oauth2Client.getToken(code); // triggers 'tokens' event

            this.logger.log(`Authorization successful`, { access_token: response.tokens.access_token });

            return response.tokens;
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);
                const error_description = String(ex.response?.data.error_description);
                const innerError = new Error(`Axios error encountered during authorization: ${error} (${error_description})`);

                this.logger.error(innerError, { authorization_code: code });

                throw innerError;
            } else if (ex instanceof FetchError) {
                if (ex.type == 'system') {
                    const innerError = new Error(`System error ${ex.errno} encountered during network fetch: ${ex.message}`);

                    this.logger.error(innerError, { authorization_code: code });

                    throw innerError;
                }
            }
            
            this.logger.error(ex as Error, { authorization_code: code });

            throw ex;
        }
    }

    private async tryHandleTokensAsync(tokens: Credentials) {
        const refreshToken = await this.tryResolveRefreshTokenOrNullAsync(tokens);

        const refreshableTokens: Credentials = {
            ...tokens,

            refresh_token: refreshToken,
        };

        this.logger.log(`Using OAuth2 Client tokens`, {
            access_token: tokens.access_token,
            ...(tokens.refresh_token !== undefined) && { refresh_token: tokens.refresh_token}
        });

        this.authenticate(refreshableTokens);
    }

    private async tryResolveRefreshTokenOrNullAsync(tokens: Credentials) {
        if (tokens.access_token === undefined || tokens.access_token === null) {
            throw new Error(`No access token received`);
        }

        const userEmail = await this.resolveEmailOrNullAsync(tokens.access_token);

        if (userEmail === null) {
            return tokens.refresh_token ?? null;
        }

        const refreshToken = tokens.refresh_token ?? await this.resolvePersistedRefreshToken(userEmail);

        if (refreshToken === undefined) {
            return null;
        }

        await this.googleOAuth2TokensRepository.createOrUpdateAsync(
            userEmail,
            tokens.access_token,
            refreshToken);

        return refreshToken;
    }

    private async resolveEmailOrNullAsync(accessToken?: string) {
        if(accessToken === undefined) {
            return null;
        }

        try  {
            // https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#checking-accesstoken-information
            // This method will throw if the token is invalid.
            const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);

            return tokenInfo.email ?? null;
        } catch(ex) {
            const error = ex as Error;

            this.logger.warn(`Failed to get token info: ${error.message ?? String(ex) }`, { access_token: accessToken });

            return null;
        }
    }

    private async resolvePersistedRefreshToken(userEmail: string) {
        const persistedIdentifiers = await this.googleOAuth2TokensRepository.getOrNullAsync(userEmail);

        if (persistedIdentifiers !== null) {
            this.logger.log(`Using persisted OAuth2 refresh token`, { refresh_token: persistedIdentifiers.refreshToken });
        }
        
        return persistedIdentifiers?.refreshToken;
    }

    private authenticate(tokens: Credentials) {
        this.oauth2Client.setCredentials(tokens);
    }
}