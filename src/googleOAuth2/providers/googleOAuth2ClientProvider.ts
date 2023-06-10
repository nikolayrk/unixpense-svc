import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { inject, injectable } from 'inversify';
import { injectables } from "../../core/types/injectables";
import GoogleOAuth2TokensRepository from '../repositories/googleOAuth2TokensRepository';
import ILogger from '../../core/contracts/ILogger';
import GoogleOAuth2Identifiers from '../models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from '../../googleOAuth2/contracts/IUsesGoogleOAuth2';

@injectable()
export default class GoogleOAuth2ClientProvider implements IUsesGoogleOAuth2 {
    private readonly scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly'
    ];

    private readonly defaultRedirectUri = `${process.env.NODE_ENV === 'production'
            ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
            : `http://${process.env.HOSTNAME ?? 'localhost'}:${process.env.port ?? 8000}`
        }/api/oauthcallback`;

    private oauth2Client: OAuth2Client;

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
    }

    public get client() {
        return this.oauth2Client;
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {    
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH2_CLIENT_ID,
            process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
            identifiers.redirectUri ?? this.defaultRedirectUri);

        const persistedIdentifiersOrNull = identifiers.userEmail === undefined
            ? null
            : await this.googleOAuth2TokensRepository.getOrNullAsync(identifiers.userEmail);

        if (identifiers.accessToken !== undefined) {
            const tokenInfo = await this.oauth2Client.getTokenInfo(identifiers.accessToken);

            if (tokenInfo.email === undefined) {
                throw new Error(`No user email received from token info`);
            }

            if (tokenInfo.email !== identifiers.userEmail) {
                throw new Error(`Mismatched user email`);
            }

            this.logEventAsync(identifiers.accessToken, `Using OAuth2 Client tokens`);

            this.oauth2Client.setCredentials({
                scope: this.scopes.join(' '),
                token_type: "Bearer",
                access_token: identifiers.accessToken,
                refresh_token: identifiers.refreshToken ?? persistedIdentifiersOrNull?.refreshToken,
            });
        }
            
        this.oauth2Client.on('tokens', async (tokens: Credentials) => {
            try {
                if (tokens.access_token === undefined || tokens.access_token === null) {
                    throw new Error(`No access token received from tokens event`);
                }

                const refreshableTokens: Credentials = {
                    ...tokens,

                    refresh_token: tokens.refresh_token ?? persistedIdentifiersOrNull?.refreshToken,
                };

                this.oauth2Client.setCredentials(refreshableTokens);

                const tokenInfo = await this.oauth2Client.getTokenInfo(tokens.access_token);

                if (tokenInfo.email === undefined) {
                    throw new Error(`No user email received from new token info`);
                }
                
                await this.googleOAuth2TokensRepository.createOrUpdateAsync(
                    tokenInfo.email,
                    tokens.access_token,
                    tokens.refresh_token ?? persistedIdentifiersOrNull?.refreshToken);

                this.logEventAsync(tokens.access_token, `Received new OAuth2 Client tokens`);
            } catch(ex) {
                const error = ex as Error;

                await this.logErrorAsync(tokens.access_token ?? undefined, error);
            }
        });
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

    public logEventAsync = async (accessToken: string | undefined, message: string, labels?: Record<string, unknown>) =>
        this.logger.log(message, await this.constructLabelsAsync(accessToken, labels));

    public logWarningAsync = async (accessToken: string | undefined, message: string, labels?: Record<string, unknown>) =>
        this.logger.warn(message, await this.constructLabelsAsync(accessToken, labels));

    public logErrorAsync = async (accessToken: string | undefined, message: Error, labels?: Record<string, unknown>) =>
        this.logger.error(message, await this.constructLabelsAsync(accessToken, labels));

    private async constructLabelsAsync(accessToken?: string, labels?: Record<string, unknown>) {
        const email = await this.resolveEmailOrNullAsync(accessToken);

        const fullLabels = {
            ...(email !== null) && {
                email: email,
            },

            ...labels,
        }

        return fullLabels;
    }

    private async resolveEmailOrNullAsync(accessToken?: string) {
        if(accessToken === undefined) {
            return null;
        }

        try  {
            const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);

            return tokenInfo.email ?? null;
        } catch(ex) {
            return null;
        }
    }
}