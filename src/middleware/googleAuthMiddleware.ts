import express, { Request, Response, NextFunction } from "express";
import OAuth2ClientProvider from "../providers/oauth2ClientProvider";

export default function googleAuthMiddleware(oauth2ClientProvider: OAuth2ClientProvider) {
    const router = express.Router();

    router.use('/oauthcallback', async (req: Request, res: Response) => {
        if (await oauth2ClientProvider.checkAuthenticatedAsync() === true) {
            res.end('Already authorized');

            return;
        }

        const code = req.query.code;
    
        if (code === undefined) {
            res.end('No authorization code provided');
    
            return;
        }
    
        await oauth2ClientProvider.authenticateWithCodeAsync(code as string);

        res.end('Authorized successfully');
    });

    router.use(async (_: Request, res: Response, next: NextFunction) => {
        if (await oauth2ClientProvider.checkAuthenticatedAsync() === true) {
            next();

            return;
        }
        
        const consentUrl = oauth2ClientProvider.getConsentUrl();

        res.redirect(consentUrl);
        res.end();
    });

    return router;
}