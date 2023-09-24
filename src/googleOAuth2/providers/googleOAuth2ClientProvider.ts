import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import GoogleOAuth2Identifiers from '../models/googleOAuth2Identifiers';
import Constants from '../../constants';
import AbstractGoogleOAuth2ClientProvider from './abstractGoogleOAuth2ClientProvider';

export default class GoogleOAuth2ClientProvider extends AbstractGoogleOAuth2ClientProvider {
    private oauth2Client: OAuth2Client;

    public constructor() {
        super();

        this.oauth2Client = null!;
    }

    public override get client() {
        return this.oauth2Client;
    }

    public override async tryAuthorizeAsync(code: string) {
        this.logger.log(`Received authorization request`, { authorizationCode: code });

        try {
            const response = await this.oauth2Client.getToken(code); // triggers 'tokens' event

            this.logger.log(`Authorization successful`, { accessToken: response.tokens.access_token });

            return response.tokens;
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);
                const error_description = String(ex.response?.data.error_description);
                const innerError = new Error(`Axios error encountered during authorization: ${error} (${error_description})`);

                this.logger.error(innerError, { authorizationCode: code });

                throw innerError;
            }

            console.log(`DEBUG`);
            console.log(ex);
            console.log(`DEBUG`);
            
            this.logger.error(ex as Error, { authorizationCode: code });

            throw ex;
        }
    }

    protected override initialiseClient(identifiers: GoogleOAuth2Identifiers) {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH2_CLIENT_ID,
            process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
            identifiers.redirectUri ?? Constants.defaultRedirectUri);
        
        this.oauth2Client.on('tokens', async (tokens: Credentials) => {
            this.logger.log(`Received new OAuth2 Client tokens`, {
                accessToken: tokens.access_token,
                ...(tokens.refresh_token !== undefined) && { refreshToken: tokens.refresh_token}
            });
            
            try {
                await this.tryHandleTokensAsync(tokens);
            } catch(ex) {
                const error = ex as Error;

                this.logger.error(error, {
                    accessToken: tokens.access_token,
                    ...(tokens.refresh_token !== undefined) && { refreshToken: tokens.refresh_token}
                });
            }
        });
    }

    protected override async resolveEmailOrNullAsync(accessToken?: string) {
        if(accessToken === undefined) {
            return null;
        }

        try  {
            // https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#checking-accesstoken-information
            // This method will throw if the token is invalid.
            const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);

            return tokenInfo.email ?? null;
        } catch(ex) {
            const error = ex as Error;

            this.logger.warn(`Failed to get token info: ${error.message ?? String(ex) }`, { access_token: accessToken });

            return null;
        }
    }

    protected override authenticate(tokens: Credentials) {
        this.oauth2Client.setCredentials(tokens);
    }
}