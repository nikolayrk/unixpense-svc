export default interface GoogleOAuth2Identifiers extends Record<string, unknown> {
    redirectUri?: string;
    userEmail?: string;
    accessToken?: string;
    refreshToken?: string;
}