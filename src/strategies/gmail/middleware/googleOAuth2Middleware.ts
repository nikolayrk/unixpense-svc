import express, { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../../../dependencyInjector";
import GoogleOAuth2ClientProvider from "../providers/googleOAuth2ClientProvider";
import { injectables } from "../../../types/injectables";

export default function googleOAuth2Middleware() {
    const router = express.Router();

    const googleOAuth2ClientProvider = DependencyInjector.Singleton.resolve<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider);

    router.use('/oauthcallback', async (req: Request, res: Response) => {
        const response = await (async () => {
            if (googleOAuth2ClientProvider.isAuthenticated) {
                return 'Already authorized';
            }
    
            const code = String(req.query.code);
        
            if (code === undefined) {
                return 'No authorization code provided';
            }
        
            await googleOAuth2ClientProvider.authenticateWithCodeAsync(code);
    
            return 'Authorization code processed. Please retry your request';
        })();

        res.type('text/plain')
           .status(200)
           .end(response);
    });

    router.use(async (_: Request, res: Response, next: NextFunction) => {
        if (googleOAuth2ClientProvider.isAuthenticated) {
            next();

            return;
        }

        res.redirect(googleOAuth2ClientProvider.consentUrl);
        res.end();
    });

    return router;
}