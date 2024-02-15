import { inject, injectable } from "inversify";
import GoogleOAuth2Tokens from "../models/googleOAuth2Tokens.model";
import RepositoryError from "../../core/errors/repositoryError";
import GoogleOAuth2IdentifiersFactory from "../factories/googleOAuth2IdentifiersFactory";
import { injectables } from "../../core/types/injectables";

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
        const existingEntity = await GoogleOAuth2Tokens.findOne({
            where: {
                user_email: userEmail
            }
        });

        if (existingEntity === null) {
            try {
                await GoogleOAuth2Tokens.create({
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

        await GoogleOAuth2Tokens.update({
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
        const entity = await GoogleOAuth2Tokens
            .findOne({
                where: {
                    user_email: userEmail
                }
            });

        if (entity === null) {
            return null;
        }

        const identifiers = this.googleOAuth2IdentifiersFactory.create({
            userEmail: entity.user_email,
            accessToken: entity.access_token,
            refreshToken: entity.refresh_token
        });
        
        return identifiers;
    }
}