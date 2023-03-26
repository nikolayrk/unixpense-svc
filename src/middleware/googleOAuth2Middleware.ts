import express, { Request, Response, NextFunction } from "express";
import { GaxiosError } from 'gaxios';
import { DependencyInjector } from "../dependencyInjector";
import GoogleOAuth2ClientProvider from "../providers/googleOAuth2ClientProvider";
import { injectables } from "../types/injectables";

export default function googleOAuth2Middleware() {
    const router = express.Router();

    const googleOAuth2ClientProvider = DependencyInjector.Singleton.resolve<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider);

    router.use('/oauthcallback', async (req: Request, res: Response) => {
        let response;

        if (await googleOAuth2ClientProvider.checkAuthenticatedAsync() === true) {
            response = 'Already authorized';

            return;
        }

        const code = req.query.code;
    
        if (code === undefined) {
            response = 'No authorization code provided';
    
            return;
        }
    
        try {
            await googleOAuth2ClientProvider.tryAuthenticateWithCodeAsync(code as string);

            response = 'Authorized successfully';
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = ex.response?.data.error as string;

                console.log(`Axious error '${error}' encountered on request`);
                
                // Maybe a bit overkill...
                for(const key in ex.response?.headers) {
                    const value = ex.response?.headers[key] as string;

                    res.setHeader(key, value);
                }

                res.type(ex.config.responseType!)
                   .status(ex.response?.status!)
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