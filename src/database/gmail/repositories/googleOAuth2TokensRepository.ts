import { inject, injectable } from "inversify";
import GoogleOAuth2TokensEntity from "../entities/googleOAuth2Tokens.entity";
import RepositoryError from "../../../shared/errors/repositoryError";
import GoogleOAuth2IdentifiersFactory from "../../../services/gmail/factories/googleOAuth2IdentifiersFactory";
import { injectables } from "../../../shared/types/injectables";

@injectable()
export default class GoogleOAuth2TokensRepository {
    private readonly googleOAuth2IdentifiersFactory;

    public constructor(
        @inject(injectables.GoogleOAuth2IdentifiersFactory)
        googleOAuth2IdentifiersFactory: GoogleOAuth2IdentifiersFactory
    ) {
        this.googleOAuth2IdentifiersFactory = googleOAuth2IdentifiersFactory;
    }

    public async createOrUpdateAsync(userEmail: string, accessToken: string, refreshToken?: string) {
        const existingEntity = await GoogleOAuth2TokensEntity.findOne({
            where: {
                user_email: userEmail
            }
        });

        if (existingEntity === null) {
            try {
                await GoogleOAuth2TokensEntity.create({
                    user_email: userEmail,
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                return;
            } catch(ex) {
                // Wrap all thrown db errors and strip of possible sensitive information
                if (ex instanceof Error) {
                    throw new RepositoryError(ex);
                }
    
                throw ex;
            }
        }

        await GoogleOAuth2TokensEntity.update({
                access_token: accessToken,

                ...(refreshToken !== undefined) && {
                    refresh_token: refreshToken
                },
            }, {
                where: {
                    user_email: userEmail
                }
            });
    }

    public async getOrNullAsync(userEmail: string) {
        const entity = await GoogleOAuth2TokensEntity
            .findOne({
                where: {
                    user_email: userEmail
                }
            });

        if (entity === null) {
            return null;
        }

        const identifiers = this.googleOAuth2IdentifiersFactory.create(
            null,
            entity.user_email,
            entity.access_token,
            entity.refresh_token);
        
        return identifiers;
    }
}