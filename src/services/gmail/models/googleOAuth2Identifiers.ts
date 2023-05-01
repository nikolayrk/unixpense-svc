export default interface GoogleOAuth2Identifiers {
    clientId: string;
    clientSecret?: string;
    redirectUri?: string;
    accessToken?: string | null;
    refreshToken?: string | null;
}