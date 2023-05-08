import { inject, injectable } from "inversify";
import GoogleOAuth2IdentifierEntity from "../entities/googleOAuth2Identifer.entity";
import RepositoryError from "../../../shared/errors/repositoryError";
import GoogleOAuth2Identifiers from "../../../services/gmail/models/googleOAuth2Identifiers";
import GoogleOAuth2IdentifiersFactory from "../../../services/gmail/factories/googleOAuth2IdentifiersFactory";
import { injectables } from "../../../shared/types/injectables";

@injectable()
export default class GoogleOAuth2IdentifierRepository {
    private readonly googleOAuth2IdentifierFactory;

    public constructor(
        @inject(injectables.GoogleOAuth2IdentifiersFactory)
        googleOAuth2IdentifierFactory: GoogleOAuth2IdentifiersFactory
    ) {
        this.googleOAuth2IdentifierFactory = googleOAuth2IdentifierFactory;
    }

    public async createOrUpdateAsync(identifiers: GoogleOAuth2Identifiers) {
        const existingEntity = await GoogleOAuth2IdentifierEntity.findOne({
            where: {
                user_email: identifiers.userEmail
            }
        });

        if (existingEntity === null) {
            try {
                await GoogleOAuth2IdentifierEntity.create({
                    client_id: identifiers.clientId,
                    client_secret: identifiers.clientSecret,
                    user_email: identifiers.userEmail,
                    access_token: identifiers.accessToken,
                    refresh_token: identifiers.refreshToken,
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

        await GoogleOAuth2IdentifierEntity.update({
                access_token: identifiers.accessToken,

                ...(identifiers.refreshToken !== null) && {
                    refresh_token: identifiers.refreshToken
                },
            }, {
                where: {
                    user_email: identifiers.userEmail
                }
            });
    }

    public async getOrNullAsync(userEmail: string) {
        const entity = await GoogleOAuth2IdentifierEntity
            .findOne({
                where: {
                    user_email: userEmail
                }
            });

        if (entity === null) {
            return null;
        }

        const identifiers = this.googleOAuth2IdentifierFactory.create(
            entity.client_id, entity.client_secret, undefined,
            entity.user_email, entity.access_token, entity.refresh_token);
        
        return identifiers;
    }
}