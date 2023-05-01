import express, { Request, Response, NextFunction } from "express";
import { DependencyInjector } from "../../dependencyInjector";
import GoogleOAuth2ClientProvider from "../../services/gmail/providers/googleOAuth2ClientProvider";
import { injectables } from "../../shared/types/injectables";
import GoogleOAuth2IdentifierRepository from "../../services/gmail/repositories/googleOAuth2IdentifierRepository";
import GoogleOAuth2IdentifiersFactory from "../../services/gmail/factories/googleOAuth2IdentifiersFactory";

const redirect = async (req: Request, res: Response) => {
    const { client_id, client_secret, redirect_uri, code } = req.body;
    
    if(client_id === undefined || client_secret === undefined || redirect_uri === undefined) {
        res
            .status(403)
            .json({ error: "No credentials provided" })
            .end();

        return;
    }

    if(code === undefined) {
        res
            .status(400)
            .json({ error: "No authorization code provided" })
            .end();

        return;
    }

    const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
    
    const identifiers = googleOAuth2IdentifierFactory.create(String(client_id), String(client_secret), String(redirect_uri));

    const googleOAuth2ClientProvider = await DependencyInjector.Singleton.generateServiceAsync<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProviderGenerator, identifiers);
    
    try {
        const tokens = await googleOAuth2ClientProvider.tryAuthorizeWithCodeAsync(String(code));

        res
            .status(200)
            .json(tokens)
            .end();
    } catch(ex) {
        const error = ex as Error;
        
        googleOAuth2ClientProvider.logError(error, { clientId: identifiers.clientId });

        res
            .status(503)
            .json({ error: error.message ?? ex })
            .end();
    }
};

const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get('Authorization');
    const clientId = req.get('ClientId');

    if (authHeader === undefined) {
        res
            .status(403)
            .json({ error: "Missing authorization header" })
            .end();

        return;
    }

    if (clientId === undefined) {
        res
            .status(403)
            .json({ error: "Missing client ID header" })
            .end();

        return;
    }

    const googleOAuth2IdentifierRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifierRepository>(injectables.GoogleOAuth2IdentifierRepository);
    const persistedIdentifiers = await googleOAuth2IdentifierRepository.getOrNullAsync(clientId);

    if (persistedIdentifiers === null) {
        res
            .status(403)
            .json({ error: "Unauthorized" })
            .end();

        return;
    }
    
    const receivedAccessToken = authHeader.replace('Bearer ', '');
    const { accessToken, ...rest } = persistedIdentifiers;

    res.locals.googleOAuth2Identifiers = {
        accessToken: receivedAccessToken,

        ...rest
    };

    next();
};

export {
    redirect,
    protect,
}