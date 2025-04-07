import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'googleapis-common';
import { Credentials } from 'google-auth-library';
import GoogleOAuth2Tokens from '@shared/models/googleOAuth2Tokens.model';
import Constants from '@shared/constants';
import { FetchError } from 'node-fetch';

export class OAuth2Service {
    private readonly oauth2Client: OAuth2Client;

    constructor(redirectUri?: string) {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH2_CLIENT_ID,
            process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
            redirectUri ?? Constants.defaultRedirectUri
        );
    }

    public async resolveEmail(accessToken: string): Promise<string | null> {
        try {
            const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken);
            return tokenInfo.email ?? null;
        } catch(error) {
            return null;
        }
    }

    public async validateToken(accessToken: string): Promise<void> {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        await this.oauth2Client.getAccessToken();
    }

    public async refreshTokens(email: string, refreshToken: string): Promise<Credentials> {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        if (!credentials.access_token) {
            throw new Error('No access token in refresh response');
        }

        await GoogleOAuth2Tokens.update({
            access_token: credentials.access_token,
            ...(credentials.refresh_token && { refresh_token: credentials.refresh_token })
        }, {
            where: { user_email: email }
        });
        return credentials;
    }

    public async authorize(code: string): Promise<Credentials> {
        try {
            const response = await this.oauth2Client.getToken(code);
            const email = await this.resolveEmail(response.tokens.access_token!);
            
            if (!email) {
                throw new Error('Could not resolve email from token');
            }

            await GoogleOAuth2Tokens.upsert({
                user_email: email,
                access_token: response.tokens.access_token!,
                refresh_token: response.tokens.refresh_token ?? 'refresh_token'
            });

            return response.tokens;
        } catch(ex) {
            if (ex instanceof GaxiosError) {
                const error = String(ex.response?.data.error);
                const error_description = String(ex.response?.data.error_description);
                const innerError = new Error(`Axios error encountered during authorization: ${error} (${error_description})`);
                throw innerError;
            } else if (ex instanceof FetchError) {
                if (ex.type == 'system') {
                    const innerError = new Error(`System error ${ex.errno} encountered during network fetch: ${ex.message}`);
                    throw innerError;
                }
            }
            throw ex;
        }
    }
}
