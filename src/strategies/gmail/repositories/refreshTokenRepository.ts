import { injectable } from "inversify";
import RefreshTokenEntity from "../entities/refreshToken.entity";

@injectable()
export default class RefreshTokenRepository {
    public async createOrUpdateAsync(clientToken: string, refreshToken: string) {
        const existingEntity = await RefreshTokenEntity.findByPk(clientToken);

        if (existingEntity !== null) {
            await RefreshTokenEntity.create({
                client_token: clientToken,
                refresh_token: refreshToken
            });

            return;
        }

        await RefreshTokenEntity.update({
                refresh_token: refreshToken
            }, {
                where: {
                    client_token: clientToken
                }
            });
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