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

    private authenticated;

    constructor(clientId: string, clientSecret: string, redirectUri: string, refreshTokenRepository: RefreshTokenRepository) {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this.refreshTokenRepository = refreshTokenRepository;
        this._oauth2Client = oauth2Client;
        this.authenticated = false;

        oauth2Client.on('tokens', this.receivedTokensAsync);
    }

    public async checkAuthenticatedAsync() {
        if (this.authenticated) {
            return true;
        }

        const refreshToken = await this.refreshTokenRepository.getRefreshTokenOrNullAsync();

        if (refreshToken === null) {
            return false;
        }

        this.authenticate({
            refresh_token: refreshToken
        });

        return true;
    }

    public async authenticateWithCodeAsync(authorizationCode: string) {
        const tokenResponse = await this.oauth2Client.getToken(authorizationCode);
        const accessToken = tokenResponse.tokens;

        this.authenticate(accessToken);
    }

    public getConsentUrl() {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes
        });

        return url;
    }

    private async receivedTokensAsync(tokens: Credentials) {
        const refreshToken = tokens.refresh_token;

        if (refreshToken !== null && refreshToken !== undefined) {
            await this.refreshTokenRepository.createAsync(refreshToken);                
        }

        this.authenticate(tokens);
    }

    private authenticate(credentials: Credentials) {
        this.oauth2Client.setCredentials(credentials);

        this.authenticated = true;
    }
}