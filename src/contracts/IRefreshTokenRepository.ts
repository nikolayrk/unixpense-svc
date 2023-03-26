export default interface IRefreshTokenRepository {
    createOrUpdateAsync(clientToken: string, refreshToken: string): Promise<void>;

    getRefreshTokenOrNullAsync(userIdToken: string): Promise<string | null>;
}