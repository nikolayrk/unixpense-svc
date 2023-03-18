import RefreshTokenEntity from "../entities/refreshToken.entity";

export default class RefreshTokenRepository {
    public async createIfNotExistAsync(clientToken: string, refreshToken: string) {
        await RefreshTokenEntity.findOrCreate({
            where: {
                client_token: clientToken,
                refresh_token: refreshToken
            }
        });

        await RefreshTokenEntity.sync();
    }

    public async getRefreshTokenOrNullAsync(userIdToken: string) {
        const entity = await RefreshTokenEntity
            .findOne({
                where: {
                    client_token: userIdToken
                },
                order: ['createdAt']
            });

        if (entity === null) {
            return null;
        }

        const refreshToken = entity.refresh_token;

        return refreshToken;
    }
}