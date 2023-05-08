import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { inject, injectable } from 'inversify';
import { injectables } from "../../../shared/types/injectables";
import GoogleOAuth2IdentifierRepository from '../../../database/gmail/repositories/googleOAuth2IdentifierRepository';
import ILogger from '../../contracts/ILogger';
import GoogleOAuth2Identifiers from '../models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from '../contracts/IUsesGoogleOAuth2';

@injectable()
export default class GoogleOAuth2ClientProvider implements IUsesGoogleOAuth2 {
    private readonly scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly'
    ];

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

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {
        this.identifiers = identifiers;

        const onNewTokens = async (tokens: Credentials) => {
            try {
                const refreshableTokens: Credentials = {
                    ...tokens,
                    refresh_token: tokens.refresh_token ?? this.identifiers.refreshToken
                };

                if (tokens.access_token === undefined || tokens.access_token === null) {
                    throw new Error(`No access token received from tokens event`);
                }

                this.oauth2Client.setCredentials(refreshableTokens);

                const tokenInfo = await this.oauth2Client.getTokenInfo(tokens.access_token);

                if (tokenInfo.email === undefined) {
                    throw new Error(`No user email received from token info`);
                }

                this.identifiers.userEmail = tokenInfo.email; // For logging

                await this.googleOAuth2IdentifierRepository.createOrUpdateAsync({
                        ...this.identifiers,
            
                        userEmail: tokenInfo.email,
                        accessToken: refreshableTokens.access_token ?? null,
                        refreshToken: refreshableTokens.refresh_token ?? null
                    });

                this.logEvent(`Received new OAuth2 Client tokens`);
            } catch(ex) {
                const error = ex as Error;

                this.logError(error);
            }
        };
        
        this.oauth2Client = new google.auth
            .OAuth2(this.identifiers.clientId, this.identifiers.clientSecret)
            .on('tokens', onNewTokens);

        if (this.identifiers.accessToken !== null) {
            this.logEvent(`Using OAuth2 Client tokens`);

            this.oauth2Client.setCredentials({
                scope: this.scopes.join(' '),
                token_type: "Bearer",
                access_token: this.identifiers.accessToken,
                refresh_token: this.identifiers.refreshToken,
            });
        }
    }

    public logEvent(message: string, labels?: Record<string, unknown>) {
        this.logger.log(message, labels
            ? { email: this.identifiers.userEmail, ...labels }
            : { email: this.identifiers.userEmail });
    }

    public logWarning(message: string, labels?: Record<string, unknown>) {
        this.logger.warn(message, labels
            ? { email: this.identifiers.userEmail, ...labels }
            : { email: this.identifiers.userEmail });
    }

    public logError(message: Error, labels?: Record<string, unknown>) {
        this.logger.error(message, labels
            ? { email: this.identifiers.userEmail, ...labels }
            : { email: this.identifiers.userEmail });
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
}