import { Request, Response, NextFunction } from "express";
import OAuth2ClientProvider from "../providers/oauth2ClientProvider";

export default class GoogleApiAuth {
    private readonly oauth2ClientProvider: OAuth2ClientProvider;

    constructor(oauth2ClientProvider: OAuth2ClientProvider) {
        this.oauth2ClientProvider = oauth2ClientProvider;
    }
    
    public ensureAuthenticatedAsync = async (_: Request, res: Response, next: NextFunction) => {
        if (await this.oauth2ClientProvider.checkAuthenticatedAsync() === false) {
            const consentUrl = this.oauth2ClientProvider.getConsentUrl();

            res.redirect(consentUrl);
            res.end();

            return;
        }

        next();
    }

    public callbackAsync = async (req: Request, res: Response) => {
        const code = req.query.code;
    
        if (code === undefined) {
            res.end('No authorization code provided');
    
            return;
        }
    
        await this.oauth2ClientProvider.authenticateWithCodeAsync(code as string);

        res.end('Authorized successfully');
    }
}