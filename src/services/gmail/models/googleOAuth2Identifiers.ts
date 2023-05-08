export default interface GoogleOAuth2Identifiers {
    clientId: string;
    clientSecret: string;
    userEmail: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}