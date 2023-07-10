import { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../../dependencyInjector";
import { injectables } from "../../core/types/injectables";
import GoogleOAuth2IdentifiersFactory from "../../googleOAuth2/factories/googleOAuth2IdentifiersFactory";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";
import IOAuth2ClientProvider from "../../googleOAuth2/contracts/IOAuth2ClientProvider";

const redirect = async (req: Request, res: Response) => {
    const { client_id, client_secret, redirect_uri, code } = req.body;
    
    if(client_id === undefined || client_secret === undefined || redirect_uri === undefined) {
        return ResponseExtensions.unauthorized(res, "No credentials provided");
    }

    if (client_id !== process.env.GOOGLE_OAUTH2_CLIENT_ID || client_secret !== process.env.GOOGLE_OAUTH2_CLIENT_SECRET) {
        return ResponseExtensions.unauthorized(res, "Mismatched credentials");
    }

    if(code === undefined) {
        return ResponseExtensions.forbidden(res, "No authorization code provided");
    }

    const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
    
    const identifiers = googleOAuth2IdentifierFactory.create({ redirectUri: String(redirect_uri) });
  
    try {
        const googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<IOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);

        const tokens = await googleOAuth2ClientProvider.tryAuthorizeAsync(String(code));

        return ResponseExtensions.ok(res, tokens);
    } catch(ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');

    if (authHeader === undefined) {
        return ResponseExtensions.unauthorized(res, "No access token provided");
    }
    
    const accessToken = authHeader.replace('Bearer ', '');

    const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
    
    const identifiers = googleOAuth2IdentifierFactory.create({ accessToken });

    res.locals.googleOAuth2Identifiers = identifiers;

    return next();
};

export {
    redirect,
    protect,
}