import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import RefreshTokenRepository from "../repositories/refreshTokenRepository";
import jwt from 'jsonwebtoken';

export default class OAuth2ClientProvider {
    private readonly clientToken: string;
    private readonly refreshTokenRepository: RefreshTokenRepository;
    private readonly scopes = [
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

    private _oauth2Client: OAuth2Client;

    get oauth2Client(): OAuth2Client {
        return this._oauth2Client;
    }

    private set oauth2Client(value: OAuth2Client) {
        this._oauth2Client = value;
    }

    private authenticated: boolean;
    private refreshToken?: string;

    constructor(clientId: string, clientSecret: string, redirectUri: string, refreshTokenRepository: RefreshTokenRepository) {
        this.clientToken = jwt.sign(clientId, clientSecret, { algorithm: 'HS256' });
        this.refreshTokenRepository = refreshTokenRepository;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this._oauth2Client = oauth2Client;
        this.authenticated = false;

        oauth2Client.on('tokens', async (tokens) => {
            console.log(`Using credentials received via tokens event: ${JSON.stringify(tokens)}`);

            this.authenticateAndPersistAsync(tokens);
        });
    }

    public async checkAuthenticatedAsync() {
        if (this.authenticated) {
            return true;
        }

        await this.authenticateAndPersistAsync();

        return this.authenticated;
    }

    public async authenticateWithCodeAsync(authorizationCode: string) {
        const tokenResponse = await this.oauth2Client.getToken(authorizationCode);
        const accessToken = tokenResponse.tokens;

        console.log(`Using credentials received via authorization code: ${JSON.stringify(accessToken)}`);

        this.authenticateAndPersistAsync(accessToken);
    }

    public getConsentUrl() {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes
        });

        return url;
    }

    private async authenticateAndPersistAsync(tokens: Credentials = {}) {
        const credentials = await this.getAndHydrateUserCredentialsAsync(tokens);

        this.authenticate(credentials);
    }

    private async getAndHydrateUserCredentialsAsync(credentials: Credentials) {
        const { refresh_token, ...rest } = credentials;

        const refreshToken = await this.getAndHydrateRefreshTokenOrNullAsync(refresh_token);

        const fullCredentials: Credentials = {
            refresh_token: refreshToken,
            ...rest
        };

        return fullCredentials;
    }

    private async getAndHydrateRefreshTokenOrNullAsync(receivedRefreshToken?: string | null) {
        if (receivedRefreshToken !== null && receivedRefreshToken !== undefined) {                       
            await this.persistRefreshTokenAsync(receivedRefreshToken);

            this.storeRefreshToken(receivedRefreshToken);
        }

        const storedRefreshToken = this.refreshToken !== undefined
            ? this.refreshToken
            : null;

        const persistedRefreshToken = storedRefreshToken === null
            ? await this.getRefreshTokenOrNullAsync()
            : null;

        if (persistedRefreshToken !== null) {
            this.storeRefreshToken(persistedRefreshToken);
        }
            
        const finalRefreshToken = receivedRefreshToken !== null && receivedRefreshToken !== undefined
            ? receivedRefreshToken
            : storedRefreshToken !== null
                ? storedRefreshToken
                : persistedRefreshToken;

        return finalRefreshToken;
    }

    private storeRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
    }

    private async persistRefreshTokenAsync(refreshToken: string) {
        await this.refreshTokenRepository.createIfNotExistAsync(this.clientToken, refreshToken);
    }

    private getRefreshTokenOrNullAsync() {
        return this.refreshTokenRepository.getRefreshTokenOrNullAsync(this.clientToken)
    }

    private authenticate(credentials: Credentials) {
        const hasAccessToken = credentials.access_token === null || credentials.access_token === undefined;
        const hasRefreshToken = credentials.refresh_token === null || credentials.refresh_token === undefined;

        if (!hasAccessToken && !hasRefreshToken) {
            console.log(`No access token or refresh token provided. Consent required`);

            return;
        }

        this.oauth2Client.setCredentials(credentials);

        this.authenticated = true;
    }
}