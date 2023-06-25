export default interface IOAuth2ClientProvider {
    tryAuthorizeAsync(authorizationCode: string): Promise<any>;
}