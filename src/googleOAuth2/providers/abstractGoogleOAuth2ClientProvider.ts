import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import { injectable } from 'inversify';
import { injectables } from "../../core/types/injectables";
import GoogleOAuth2TokensRepository from '../repositories/googleOAuth2TokensRepository';
import ILogger from '../../core/contracts/ILogger';
import GoogleOAuth2Identifiers from '../models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from '../../googleOAuth2/contracts/IUsesGoogleOAuth2';
import Constants from '../../constants';
import IOAuth2ClientProvider from '../contracts/IOAuth2ClientProvider';
import { DependencyInjector } from '../../dependencyInjector';

@injectable()
export default abstract class AbstractGoogleOAuth2ClientProvider implements IOAuth2ClientProvider, IUsesGoogleOAuth2 {
    protected readonly logger;
    
    private readonly googleOAuth2TokensRepository;

    public constructor() {
        this.logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        this.googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository);
    }

    public async useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers) {   
        this.initialiseClient(identifiers);

        if (identifiers.accessToken !== undefined) {
            const tokens: Credentials = {
                scope: Constants.scopes.join(' '),
                token_type: "Bearer",
                access_token: identifiers.accessToken,
                refresh_token: identifiers.refreshToken
            };

            await this.tryHandleTokensAsync(tokens);
        }
    }

    public abstract get client(): string | OAuth2Client;

    public abstract tryAuthorizeAsync(code: string): Promise<any>;

    protected abstract initialiseClient(identifiers: GoogleOAuth2Identifiers): void;

    protected abstract resolveEmailOrNullAsync(accessToken?: string): Promise<string | null>;

    protected abstract authenticate(tokens: Credentials): void;

    protected async tryHandleTokensAsync(tokens: Credentials) {
        const refreshToken = await this.tryResolveRefreshTokenOrNullAsync(tokens);

        const refreshableTokens: Credentials = {
            ...tokens,

            refresh_token: refreshToken,
        };

        this.logger.log(`Using OAuth2 Client tokens`, { ...tokens });

        this.authenticate(refreshableTokens);
    }

    private async tryResolveRefreshTokenOrNullAsync(tokens: Credentials) {
        if (tokens.access_token === undefined || tokens.access_token === null) {
            throw new Error(`No access token received`);
        }

        const userEmail = await this.resolveEmailOrNullAsync(tokens.access_token);

        if (userEmail === null) {
            return tokens.refresh_token ?? null;
        }

        const refreshToken = tokens.refresh_token ?? await this.resolvePersistedRefreshToken(userEmail);

        await this.googleOAuth2TokensRepository.createOrUpdateAsync(
            userEmail,
            tokens.access_token,
            refreshToken);

        return refreshToken;
    }

    private async resolvePersistedRefreshToken(userEmail: string) {
        const persistedIdentifiers = await this.googleOAuth2TokensRepository.getOrNullAsync(userEmail);

        if (persistedIdentifiers !== null) {
            this.logger.log(`Using persisted OAuth2 refresh token`, { refresh_token: persistedIdentifiers.refreshToken });
        }
        
        return persistedIdentifiers?.refreshToken;
    }
}