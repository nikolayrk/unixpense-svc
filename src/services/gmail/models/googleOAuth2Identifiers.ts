export default interface GoogleOAuth2Identifiers {
    redirectUri: string | null;
    userEmail: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}