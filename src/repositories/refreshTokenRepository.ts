import { injectable } from "inversify";
import IRefreshTokenRepository from "../contracts/IRefreshTokenRepository";
import RefreshTokenEntity from "../entities/refreshToken.entity";

@injectable()
export default class RefreshTokenRepository implements IRefreshTokenRepository {
    public async createIfNotExistAsync(clientToken: string, refreshToken: string) {
        const [_, created] = await RefreshTokenEntity.findOrCreate({
            where: {
                client_token: clientToken,
                refresh_token: refreshToken
            }
        });

        return created;
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