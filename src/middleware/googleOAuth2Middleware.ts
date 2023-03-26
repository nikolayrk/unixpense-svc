import express, { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../dependencyInjector";
import GoogleOAuth2ClientProvider from "../providers/googleOAuth2ClientProvider";
import { injectables } from "../types/injectables";

export default function googleOAuth2Middleware() {
    const router = express.Router();

    const googleOAuth2ClientProvider = DependencyInjector.Singleton.resolve<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider);

    router.use('/oauthcallback', async (req: Request, res: Response) => {
        if (await googleOAuth2ClientProvider.checkAuthenticatedAsync() === true) {
            res.end('Already authorized');

            return;
        }

        const code = req.query.code;
    
        if (code === undefined) {
            res.end('No authorization code provided');
    
            return;
        }
    
        await googleOAuth2ClientProvider.authenticateWithCodeAsync(code as string);

        res.end('Authorized successfully');
    });

    router.use(async (_: Request, res: Response, next: NextFunction) => {
        if (await googleOAuth2ClientProvider.checkAuthenticatedAsync() === true) {
            next();

            return;
        }

        res.redirect(googleOAuth2ClientProvider.consentUrl);
        res.end();
    });

    return router;
}