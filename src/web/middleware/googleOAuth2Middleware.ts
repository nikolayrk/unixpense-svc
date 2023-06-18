import { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2ClientProvider from "../../googleOAuth2/providers/googleOAuth2ClientProvider";
import { injectables } from "../../core/types/injectables";
import GoogleOAuth2IdentifiersFactory from "../../googleOAuth2/factories/googleOAuth2IdentifiersFactory";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";

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
    
    const identifiers = googleOAuth2IdentifierFactory.create(String(redirect_uri));

    const googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateServiceAsync<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);
    
    try {
        const tokens = await googleOAuth2ClientProvider.tryAuthorizeWithCodeAsync(String(code));

        return ResponseExtensions.ok(res, tokens);
    } catch(ex) {
        const error = ex as Error;
        
        googleOAuth2ClientProvider.logError(error, { ...req.body });

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    const userEmail = req.get('X-User-Email');

    if (authHeader === undefined) {
        return ResponseExtensions.unauthorized(res, "No access token provided");
    }

    if (userEmail === undefined) {
        return ResponseExtensions.unauthorized(res, "No user email provided");
    }
    
    const accessToken = authHeader.replace('Bearer ', '');

    const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
    
    const identifiers = googleOAuth2IdentifierFactory.create(undefined, userEmail, accessToken);

    res.locals.googleOAuth2Identifiers = identifiers;

    return next();
};

export {
    redirect,
    protect,
}