import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { inject, injectable } from 'inversify';
import { injectables } from "../types/injectables";
import IRefreshTokenRepository from '../contracts/IRefreshTokenRepository';

@injectable()
export default class GoogleOAuth2ClientProvider {
    public get get() {
        return this.oauth2Client;
    }

    private readonly scopes = [
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

    private readonly oauth2Client: OAuth2Client;

    private readonly getPersistedRefreshTokenAsync;
    private readonly setPersistRefreshTokenAsync;

    private authenticated: boolean;
    private refreshToken?: string;

    public constructor(
        @inject(injectables.IRefreshTokenRepository) refreshTokenRepository: IRefreshTokenRepository
    ) {
        const clientId = process.env.UNIXPENSE_GOOGLE_CLIENT_ID;
        const clientSecret = process.env.UNIXPENSE_GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.UNIXPENSE_GOOGLE_REDIRECT_URI;

        if (clientId === undefined || 
            clientSecret === undefined || 
            redirectUri === undefined) {
            throw new Error(`Missing OAuth2 credentials`);
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this.oauth2Client = oauth2Client;

        const clientToken = jwt.sign(clientId, clientSecret, { algorithm: 'HS256' });

        this.getPersistedRefreshTokenAsync = () => refreshTokenRepository.getRefreshTokenOrNullAsync(clientToken);
        this.setPersistRefreshTokenAsync = (refreshToken: string) => refreshTokenRepository.createIfNotExistAsync(clientToken, refreshToken);

        this.authenticated = false;
        
        oauth2Client.on('tokens', async (tokens) => {
            console.log(`Using credentials received via tokens event: ${JSON.stringify(tokens)}`);

            this.authenticateAndPersistAsync(tokens);
        });
    }

    public get consentUrl() { return (() =>
        this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes
        }))()}; // lambda getters when :(

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
            await this.setPersistRefreshTokenAsync(receivedRefreshToken);

            console.log(`Received new refresh token`);

            this.storeRefreshToken(receivedRefreshToken);
        }

        const storedRefreshToken = this.refreshToken !== undefined
            ? this.refreshToken
            : null;

        const persistedRefreshToken = storedRefreshToken === null
            ? await this.getPersistedRefreshTokenAsync()
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
        console.log(`Using refresh token: ${refreshToken}`);

        this.refreshToken = refreshToken;
    }

    private authenticate(credentials: Credentials) {
        const hasAccessToken = credentials.access_token !== null && credentials.access_token !== undefined;
        const hasRefreshToken = credentials.refresh_token !== null && credentials.refresh_token !== undefined;

        if (!hasAccessToken && !hasRefreshToken) {
            console.log(`No access token or refresh token provided. Consent required`);

            return;
        }

        this.oauth2Client.setCredentials(credentials);

        this.authenticated = true;
    }
}