import { Request, Response, NextFunction } from "express";
import { google } from 'googleapis';
import { OAuth2Client } from "google-auth-library";

export default class Authentication {
    private _oauth2Client: OAuth2Client;
    private authenticated: boolean;

    get oauth2Client(): OAuth2Client {
        return this._oauth2Client;
    }

    private set oauth2Client(value: OAuth2Client) {
        this._oauth2Client = value;
    }

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        this._oauth2Client = oauth2Client;
        this.authenticated = false;
    }

    public ensureAuthenticated = (_: Request, res: Response, next: NextFunction) => {
        if (this.authenticated == false) {
            const scopes = [
                'https://www.googleapis.com/auth/gmail.readonly'
              ];
        
            const url = this.oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes
            });

            res.redirect(url);

            return;
        }

        next();
    }

    public oauth2Callback = async (req: Request, res: Response) => {
        const code = req.query.code?.toString();
    
        if (code === undefined) {
            res.send('No authorization code provided');
    
            return;
        }
    
        const tokenResponse = await this.oauth2Client.getToken(code);
        const token = tokenResponse.tokens;

        this.oauth2Client.setCredentials(token);

        this.authenticated = true;

        res.send('Authorized successfully');
    }
}