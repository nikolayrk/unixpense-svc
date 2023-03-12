import { Request, Response, NextFunction } from "express";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import RefreshTokenRepository from "../repositories/refreshTokenRepository";
import { Credentials } from 'google-auth-library';

export default class GoogleApiAuth {
    private _oauth2Client: OAuth2Client;
    private readonly refreshTokenRepository: RefreshTokenRepository;
    private authenticated: boolean;
    private readonly scopes = [
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

    get oauth2Client(): OAuth2Client {
        return this._oauth2Client;
    }

    private set oauth2Client(value: OAuth2Client) {
        this._oauth2Client = value;
    }

    constructor(clientId: string, clientSecret: string, redirectUri: string, refreshTokenRepository: RefreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this._oauth2Client = oauth2Client;
        this.authenticated = false;

        oauth2Client.on('tokens', async (tokens) => {
            const refreshToken = tokens.refresh_token;

            if (refreshToken !== null && refreshToken !== undefined) {
                await refreshTokenRepository.createAsync(refreshToken);                
            }

            this.authenticate(tokens);
        });
    }

    public ensureAuthenticatedAsync = async (_: Request, res: Response, next: NextFunction) => {
        if (await this.checkAuthenticatedAsync() === false) {
            const url = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes
            });

            res.redirect(url);
            res.end();

            return;
        }

        next();
    }

    public callbackAsync = async (req: Request, res: Response) => {
        const code = req.query.code?.toString();
    
        if (code === undefined) {
            res.end('No authorization code provided');
    
            return;
        }
    
        const tokenResponse = await this.oauth2Client.getToken(code);
        const accessToken = tokenResponse.tokens;

        this.authenticate(accessToken);

        res.end('Authorized successfully');
    }

    private async checkAuthenticatedAsync() {
        if (this.authenticated) {
            return true;
        }

        const existingRefreshToken = await this.refreshTokenRepository.getRefreshTokenOrNull();

        if (existingRefreshToken === null) {
            return false;
        }

        this.authenticate({
            refresh_token: existingRefreshToken
        });

        return true;
    }

    private authenticate(credentials: Credentials) {
        this.oauth2Client.setCredentials(credentials);

        this.authenticated = true;
    }
}