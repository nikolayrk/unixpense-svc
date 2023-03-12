import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import RefreshTokenRepository from "../repositories/refreshTokenRepository";

export default class OAuth2ClientProvider {
    private readonly scopes = [
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

    private readonly refreshTokenRepository: RefreshTokenRepository;

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
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this.refreshTokenRepository = refreshTokenRepository;
        this._oauth2Client = oauth2Client;
        this.authenticated = false;

        oauth2Client.on('tokens', async (tokens) => {
            const receivedRefreshToken = tokens.refresh_token !== null && tokens.refresh_token !== undefined
                ? tokens.refresh_token
                : null;

            if (receivedRefreshToken !== null) {
                console.log(`Persisting refresh token received via 'tokens' event: ${JSON.stringify(tokens)}`);

                await this.refreshTokenRepository.createIfNotExistAsync(receivedRefreshToken);

                this.setRefreshToken(receivedRefreshToken);
            }

            const storedRefreshToken = this.refreshToken !== undefined
                ? this.refreshToken
                : null;

            const persistedRefreshToken = storedRefreshToken === null
                ? await this.refreshTokenRepository.getRefreshTokenOrNullAsync()
                : null;

            if (persistedRefreshToken !== null) {
                console.log(`Using persisted refresh token from 'tokens' event: ${persistedRefreshToken}`);

                this.setRefreshToken(persistedRefreshToken);
            }
                
            const finalRefreshToken = receivedRefreshToken !== null
                ? receivedRefreshToken
                : storedRefreshToken !== null
                    ? storedRefreshToken
                    : persistedRefreshToken;

            if (finalRefreshToken === null) {
                // No refresh token from the tokens event, nor previously stored, nor persisted
                // Should not happen
                console.log(`No refresh token from the tokens event, nor previously received, nor persisted`)

                return;
            }

            console.log(`Using credentials received via 'tokens' event: ${JSON.stringify(tokens)}`);

            this.authenticate(tokens);
        });
    }

    public async checkAuthenticatedAsync() {
        if (this.authenticated) {
            return true;
        }

        const refreshToken = await this.refreshTokenRepository.getRefreshTokenOrNullAsync();

        if (refreshToken === null) {
            console.log(`Couldn't find persisted refresh token`);

            return false;
        }

        console.log(`Using persisted refresh token: ${refreshToken}`);

        this.setRefreshToken(refreshToken);

        this.authenticate();

        return true;
    }

    public async authenticateWithCodeAsync(authorizationCode: string) {
        const tokenResponse = await this.oauth2Client.getToken(authorizationCode);
        const accessToken = tokenResponse.tokens;

        console.log(`Using access token received via code: ${JSON.stringify(accessToken)}`);

        this.authenticate(accessToken);
    }

    public getConsentUrl() {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes
        });

        return url;
    }

    private authenticate(credentials: Credentials = {}) {
        const {refresh_token, ...rest} = credentials;
        const passedRefreshToken = refresh_token;
        
        const refreshToken = passedRefreshToken !== null && passedRefreshToken !== undefined
            ? passedRefreshToken
            : this.refreshToken;

        const fullCredentials: Credentials = {
            refresh_token: refreshToken,
            ...rest
        };

        this.oauth2Client.setCredentials(fullCredentials);

        this.authenticated = true;
    }

    private setRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
}