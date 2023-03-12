import { col, Op } from "sequelize";
import RefreshTokenEntity from "../entities/refreshToken.entity";
import { Credentials } from 'google-auth-library';

export default class RefreshTokenRepository {
    public async createAsync(refreshToken: string) {
        await RefreshTokenEntity.create({
            token: refreshToken
        });

        await RefreshTokenEntity.sync();
    }

    public async getRefreshTokenOrNull() {
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