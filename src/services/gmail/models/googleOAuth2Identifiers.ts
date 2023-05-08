export default interface GoogleOAuth2Identifiers {
    clientId: string;
    clientSecret: string;
    redirectUri: string | null;
    userEmail: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}