import { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2ClientProvider from "../../services/gmail/providers/googleOAuth2ClientProvider";
import { injectables } from "../../shared/types/injectables";
import GoogleOAuth2IdentifierRepository from "../../database/gmail/repositories/googleOAuth2TokensRepository";
import GoogleOAuth2IdentifiersFactory from "../../services/gmail/factories/googleOAuth2IdentifiersFactory";

const redirect = async (req: Request, res: Response) => {
    const { client_id, client_secret, redirect_uri, code } = req.body;
    
    if(client_id === undefined || client_secret === undefined || redirect_uri === undefined) {
        return res
            .status(403)
            .json({ error: "No credentials provided" })
            .end();
    }

    if (client_id !== process.env.GOOGLE_OAUTH2_CLIENT_ID || client_secret !== process.env.GOOGLE_OAUTH2_CLIENT_SECRET) {
        return res
            .status(403)
            .json({ error: "Mismatched credentials" })
            .end();
    }

    if(code === undefined) {
        return res
            .status(400)
            .json({ error: "No authorization code provided" })
            .end();
    }

    const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
    
    const identifiers = googleOAuth2IdentifierFactory.create(String(redirect_uri));

    const googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateServiceAsync<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);
    
    try {
        const tokens = await googleOAuth2ClientProvider.tryAuthorizeWithCodeAsync(String(code));

        return res
            .status(200)
            .json(tokens)
            .end();
    } catch(ex) {
        const error = ex as Error;
        
        googleOAuth2ClientProvider.logError(error, { ...req.body });

        return res
            .status(503)
            .json({ error: error.message ?? ex })
            .end();
    }
};

const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    const userEmail = req.get('User-Email');

    if (authHeader === undefined) {
        return res
            .status(403)
            .json({ error: "Missing authorization header" })
            .end();
    }

    if (userEmail === undefined) {
        return res
            .status(403)
            .json({ error: "Missing user email header" })
            .end();
    }

    const googleOAuth2IdentifierRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifierRepository>(injectables.GoogleOAuth2TokensRepository);
    const persistedIdentifiers = await googleOAuth2IdentifierRepository.getOrNullAsync(userEmail);

    if (persistedIdentifiers === null) {
        return res
            .status(403)
            .json({ error: "No Google OAuth Credentials found" })
            .end();
    }

    if (persistedIdentifiers.accessToken === null || persistedIdentifiers.refreshToken === null) {
        return res
            .status(403)
            .json({
                error:  'There was an issue during the initial OAuth Consent Flow. ' +

                        'Please navigate to https://myaccount.google.com/permissions ' +
                        'and under \'Third-party apps with account access\', ' +
                        'find \'Unixpense Tracker\' then click \'Remove Access\'. ' + 

                        'Once done, go through the Google OAuth flow again.',
            })
            .end();
    }
    
    const receivedAccessToken = authHeader.replace('Bearer ', '');
    const { accessToken, ...rest } = persistedIdentifiers;

    res.locals.googleOAuth2Identifiers = {
        accessToken: receivedAccessToken,

        ...rest
    };

    return next();
};

export {
    redirect,
    protect,
}