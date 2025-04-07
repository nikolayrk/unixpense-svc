export default interface IUsesGoogleAuth {
    authenticate(accessToken: string): void;
}