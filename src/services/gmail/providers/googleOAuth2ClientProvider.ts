import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { inject, injectable } from 'inversify';
import { injectables } from "../../../shared/types/injectables";
import GoogleOAuth2IdentifierRepository from '../repositories/googleOAuth2IdentifierRepository';
import ILogger from '../../contracts/ILogger';
import GoogleOAuth2Identifiers from '../models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from '../contracts/IUsesGoogleOAuth2';

@injectable()
export default class GoogleOAuth2ClientProvider implements IUsesGoogleOAuth2 {
    private readonly scope = 'https://www.googleapis.com/auth/gmail.readonly';

    private oauth2Client: OAuth2Client;
    private identifiers: GoogleOAuth2Identifiers;

    private readonly logger;
    private readonly googleOAuth2IdentifierRepository;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

        @inject(injectables.GoogleOAuth2IdentifierRepository)
        googleOAuth2IdentifierRepository: GoogleOAuth2IdentifierRepository
    ) {
        this.logger = logger;
        this.googleOAuth2IdentifierRepository = googleOAuth2IdentifierRepository;
        this.oauth2Client = null!;
        this.identifiers = null!;
    }

    public get client() {
        return this.oauth2Client;
    }

    public async useAsync(identifiers: GoogleOAuth2Identifiers) {
        const persistedIdentifiers = identifiers.accessToken !== undefined
            ? await this.googleOAuth2IdentifierRepository.getOrNullAsync({ access_token: identifiers.accessToken })
            : null;

        this.identifiers = {
            clientId: identifiers.clientId ?? persistedIdentifiers?.clientId,
            clientSecret: identifiers.clientSecret ?? persistedIdentifiers?.clientSecret,
            redirectUri: identifiers.redirectUri ?? persistedIdentifiers?.redirectUri,
            accessToken: identifiers.accessToken ?? persistedIdentifiers?.accessToken,
            refreshToken: identifiers.refreshToken ?? persistedIdentifiers?.refreshToken,
        }
        
        this.oauth2Client = new google.auth
            .OAuth2(this.identifiers.clientId, this.identifiers.clientSecret, this.identifiers.redirectUri)
            .on('tokens', async (tokens) => {
                this.logEvent(`Received new OAuth2 Client tokens`);

                try {
                    const tokensWithPersistedRefreshTokenOrNull = await this.tryUsePersistedRefreshTokenOrNullAsync(tokens);

                    this.authorizeWithTokens(tokensWithPersistedRefreshTokenOrNull ?? tokens);
                } catch(ex) {
                    const error = ex as Error;

                    this.logError(error);
                }
            });

        if (this.identifiers.accessToken !== undefined) {
            this.logEvent(`Using OAuth2 Client tokens`);

            this.authorizeWithTokens({
                scope: this.scope,
                token_type: "Bearer",
                access_token: this.identifiers.accessToken,
                refresh_token: this.identifiers.refreshToken,
            });
        }
    }

    public logEvent(message: string, labels?: Record<string, unknown>) {
        this.logger.log(message, labels
            ? { clientId: this.identifiers.clientId, ...labels }
            : { clientId: this.identifiers.clientId });
    }

    public logWarning(message: string, labels?: Record<string, unknown>) {
        this.logger.warn(message, labels
            ? { clientId: this.identifiers.clientId, ...labels }
            : { clientId: this.identifiers.clientId });
    }

    public logError(message: Error, labels?: Record<string, unknown>) {
        this.logger.error(message, labels
            ? { clientId: this.identifiers.clientId, ...labels }
            : { clientId: this.identifiers.clientId });
    }

    // throws Error
    public async tryAuthorizeWithCodeAsync(authorizationCode: string) {
        try {
            const response = await this.oauth2Client.getToken(authorizationCode); // triggers 'tokens' event

            return response.tokens;
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);
                const error_description = String(ex.response?.data.error_description);
                const innerError = new Error(`Axios error encountered on authorization request: ${error} (${error_description})`);

                throw innerError;
            }

            throw ex;
        }
    }

    private authorizeWithTokens(tokens: Credentials) {
        this.oauth2Client.setCredentials(tokens);
    }

    // throws Error
    private async tryUsePersistedRefreshTokenOrNullAsync(tokens: Credentials) {
        const { refresh_token, ...rest } = tokens;

        if ((refresh_token === null || refresh_token === undefined) &&
            (this.identifiers.refreshToken === null || this.identifiers.refreshToken === undefined)) {
            throw new Error(`No refresh token was received from an authorization request, nor was a previously persisted one found. To force a refresh token to be sent on next auth, navigate to https://myaccount.google.com/permissions and under 'Third-party apps with account access', find 'Unixpense Tracker' then click 'Remove Access'`);
        }

        await this.persistTokensAsync(tokens);

        return {
            refresh_token: refresh_token ?? this.identifiers.refreshToken,
            ...rest
        } as Credentials;
    }
    
    private persistTokensAsync = (tokens: Credentials) => 
        this.googleOAuth2IdentifierRepository.createOrUpdateAsync({
            ...this.identifiers,

            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
        });
}