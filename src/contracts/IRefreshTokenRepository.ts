export default interface IRefreshTokenRepository {
    createIfNotExistAsync(clientToken: string, refreshToken: string): Promise<boolean>;

    getRefreshTokenOrNullAsync(userIdToken: string): Promise<string | null>;
}