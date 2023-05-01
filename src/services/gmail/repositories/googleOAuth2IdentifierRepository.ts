import { inject, injectable } from "inversify";
import GoogleOAuth2IdentifierEntity from "../entities/googleOAuth2Identifer.entity";
import RepositoryError from "../../../shared/errors/repositoryError";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";
import GoogleOAuth2IdentifiersFactory from "../factories/googleOAuth2IdentifiersFactory";
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
                client_id: identifiers.clientId,
            }
        });

        if (existingEntity === null) {
            try {
                await GoogleOAuth2IdentifierEntity.create({
                    client_id: identifiers.clientId,
                    client_secret: identifiers.clientSecret,
                    redirect_uri: identifiers.redirectUri,
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

                ...(identifiers.refreshToken !== null && identifiers.refreshToken !== undefined) && {
                    refresh_token: identifiers.refreshToken
                },
            }, {
                where: {
                    client_id: identifiers.clientId
                }
            });
    }

    public async getOrNullAsync(clientId: string) {
        const entity = await GoogleOAuth2IdentifierEntity
            .findOne({
                where: {
                    client_id: clientId
                }
            });

        if (entity === null) {
            return null;
        }

        const identifiers = this.googleOAuth2IdentifierFactory.create(
            entity.client_id, entity.client_secret, entity.redirect_uri,
            entity.access_token, entity.refresh_token);
        
        return identifiers;
    }
}