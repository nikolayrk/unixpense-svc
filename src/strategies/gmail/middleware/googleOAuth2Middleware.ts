import express, { Request, Response, NextFunction } from "express";
import { GaxiosError } from 'gaxios';
import { DependencyInjector } from "../../../dependencyInjector";
import GoogleOAuth2ClientProvider from "../providers/googleOAuth2ClientProvider";
import { injectables } from "../../../types/injectables";

export default function googleOAuth2Middleware() {
    const router = express.Router();

    const googleOAuth2ClientProvider = DependencyInjector.Singleton.resolve<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider);

    router.use('/oauthcallback', async (req: Request, res: Response) => {
        let response;

        if (await googleOAuth2ClientProvider.checkAuthenticatedAsync() === true) {
            response = 'Already authorized';

            return;
        }

        const code = String(req.query.code);
    
        if (code === undefined) {
            response = 'No authorization code provided';
    
            return;
        }
    
        try {
            await googleOAuth2ClientProvider.tryAuthenticateWithCodeAsync(code);

            response = 'Authorized successfully';
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);

                console.log(`Axios error '${error}' encountered on request`);
                
                // Maybe a bit overkill...
                for(const key in ex.response?.headers) {
                    const value = String(ex.response?.headers[key]);

                    res.setHeader(key, value);
                }

                res.status(ex.response?.status ?? 400)
                   .end();

                return null;
            }

            throw ex;
        }

        res.type('text/plain')
           .status(200)
           .end(response);
    });

    router.use(async (_: Request, res: Response, next: NextFunction) => {
        if (await googleOAuth2ClientProvider.checkAuthenticatedAsync() === true) {
            next();

            return;
        }

        // TODO: Store next() information in session & automatically redirect (after 2-3s?) in the /oauthcallback route
        res.redirect(googleOAuth2ClientProvider.consentUrl);
        res.end();
    });

    return router;
}