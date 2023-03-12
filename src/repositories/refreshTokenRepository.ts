import RefreshTokenEntity from "../entities/refreshToken.entity";

export default class RefreshTokenRepository {
    public async createIfNotExistAsync(refreshToken: string) {
        await RefreshTokenEntity.findOrCreate({
            where: {
                token: refreshToken
            }
        });

        await RefreshTokenEntity.sync();
    }

    public async getRefreshTokenOrNullAsync() {
        const entity = await RefreshTokenEntity
            .findOne({
                order: ['createdAt']
            });

        if (entity === null) {
            return null;
        }

        const refreshToken = entity.token;

        return refreshToken;
    }
}