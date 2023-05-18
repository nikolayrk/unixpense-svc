import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { inject, injectable } from 'inversify';
import { injectables } from "../../../shared/types/injectables";
import GoogleOAuth2TokensRepository from '../../../database/gmail/repositories/googleOAuth2TokensRepository';
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
    private readonly googleOAuth2TokensRepository;

    public constructor(
        @inject(injectables.ILogger)
        logger: ILogger,

        @inject(injectables.GoogleOAuth2TokensRepository)
        googleOAuth2TokensRepository: GoogleOAuth2TokensRepository
    ) {
        this.logger = logger;
        this.googleOAuth2TokensRepository = googleOAuth2TokensRepository;
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

                await this.googleOAuth2TokensRepository.createOrUpdateAsync(
                    tokenInfo.email,
                    tokens.access_token,
                    tokens.refresh_token ?? this.identifiers.refreshToken);

                this.logEvent(`Received new OAuth2 Client tokens`);
            } catch(ex) {
                const error = ex as Error;

                this.logError(error);
            }
        };

        const defaultRedirectUri = `${process.env.NODE_ENV === 'production'
            ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
            : `http://${process.env.HOSTNAME ?? 'localhost'}:${process.env.port ?? 8000}`
        }/api/transactions/gmail/oauthcallback`;
        
        this.oauth2Client = new google.auth
            .OAuth2(
                process.env.GOOGLE_OAUTH2_CLIENT_ID,
                process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
                this.identifiers.redirectUri ?? defaultRedirectUri)
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
            ? { ...this.identifiers, ...labels }
            : { ...this.identifiers });
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