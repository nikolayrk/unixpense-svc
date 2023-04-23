import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { inject, injectable } from 'inversify';
import { injectables } from "../../shared/types/injectables";
import RefreshTokenRepository from '../../database/repositories/refreshTokenRepository';
import ILogger from '../contracts/ILogger';

@injectable()
export default class GoogleOAuth2ClientProvider {
    public get client() {
        return this.oauth2Client;
    }

    public get consentUrl() { return (() =>
        this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [ 'https://www.googleapis.com/auth/gmail.readonly' ]
        }))()} // lambda getters when :(

    public get isAuthenticated() {
        return this.authenticated;
    }

    private readonly logger: ILogger;

    private readonly oauth2Client: OAuth2Client;
    private readonly clientToken: string;

    private readonly getPersistedRefreshTokenAsync;
    private readonly setPersistRefreshTokenAsync;

    private authenticated: boolean;
    private refreshToken?: string;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

        @inject(injectables.RefreshTokenRepository)
        refreshTokenRepository: RefreshTokenRepository
    ) {
        const clientId = process.env.UNIXPENSE_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.UNIXPENSE_GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.UNIXPENSE_GOOGLE_REDIRECT_URI;

        if (clientId === undefined || 
            clientSecret === undefined || 
            redirectUri === undefined) {
            throw new Error(`Missing OAuth2 credentials`);
        }

        this.logger = logger;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this.oauth2Client = oauth2Client;

        const clientToken = jwt.sign(clientId, clientSecret, { algorithm: 'HS256' });

        this.clientToken = clientToken;

        this.getPersistedRefreshTokenAsync = () => refreshTokenRepository.getRefreshTokenOrNullAsync(clientToken);
        this.setPersistRefreshTokenAsync = (refreshToken: string) => refreshTokenRepository.createOrUpdateAsync(clientToken, refreshToken);

        this.authenticated = false;
        
        oauth2Client.on('tokens', async (tokens) => {
            this.logEvent(`Using credentials received via tokens event`);

            try {
                await this.tryAuthenticateAndPersistAsync(tokens);
            } catch(ex) {
                const error = ex as Error;

                this.logError(error);
            }
        });
    }

    public async authenticateWithCodeAsync(authorizationCode: string) {
        await this.getTokensFromCodeAsync(authorizationCode);
    }

    public logEvent(message: string, labels?: Record<string, unknown>) {
        this.logger.log(message, labels
            ? { clientToken: this.clientToken, ...labels }
            : { clientToken: this.clientToken });
    }

    public logWarning(message: string, labels?: Record<string, unknown>) {
        this.logger.warn(message, labels
            ? { clientToken: this.clientToken, ...labels }
            : { clientToken: this.clientToken });
    }

    public logError(message: Error, labels?: Record<string, unknown>) {
        this.logger.error(message, labels
            ? { clientToken: this.clientToken, ...labels }
            : { clientToken: this.clientToken });
    }

    private async getTokensFromCodeAsync(authorizationCode: string) {
        try {
            await this.oauth2Client.getToken(authorizationCode); // triggers 'tokens' event
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);
                const error_description = String(ex.response?.data.error_description);
                const innerError = new Error(`Axios error encountered on authorization request: ${error} (${error_description})`);

                this.logError(innerError, { authorizationCode: authorizationCode });

                return;
            }

            throw ex;
        }
    }

    // throws Error
    private async tryAuthenticateAndPersistAsync(tokens: Credentials = {}) {
        const { refresh_token, access_token, ...rest } = tokens;

        const refreshToken = await this.getAndHydrateRefreshTokenOrNullAsync(refresh_token);

        if (refreshToken === null) {
            throw new Error(`No refresh token was found either from an authentication request, in-memory storage, or persistence. To force a refresh token to be provided on next auth, navigate to https://myaccount.google.com/permissions and under 'Third-party apps with account access', find 'Unixpense Tracker' then click 'Remove Access'`);
        }

        const credentials: Credentials = {
            refresh_token: refreshToken,
            access_token: access_token,
            ...rest
        };

        await this.authenticate(credentials);
    }

    // throws Error
    private async getAndHydrateRefreshTokenOrNullAsync(receivedRefreshToken?: string | null) {
        if (receivedRefreshToken !== null && receivedRefreshToken !== undefined) {
            this.logEvent(`Received new refresh token`);                   

            await this.setPersistRefreshTokenAsync(receivedRefreshToken);

            this.setRefreshToken(receivedRefreshToken);

            return receivedRefreshToken;
        }

        if (this.refreshToken !== undefined) {
            this.logEvent(`Using stored in-memory refresh token`);

            return this.refreshToken;
        }

        const persistedRefreshToken = await this.getPersistedRefreshTokenAsync();

        if (persistedRefreshToken !== null) {
            this.logEvent(`Obtained persisted refresh token`);

            this.setRefreshToken(persistedRefreshToken);

            return persistedRefreshToken;
        }

        return null;
    }

    private setRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
    }

    private async authenticate(credentials: Credentials) {
        this.oauth2Client.setCredentials(credentials);

        if (credentials.access_token === null || credentials.access_token === undefined) {
            this.logEvent(`No access token provided. Consent required`);
    
            return;
        }

        this.authenticated = true;
    }
}