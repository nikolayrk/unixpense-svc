import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

@injectable()
export default class GoogleOAuth2IdentifiersFactory {
    public create(clientId: string, clientSecret: string, redirectUri: string, accessToken?: string, refreshToken?: string) {
        return {
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: redirectUri,
            accessToken: accessToken,
            refreshToken: refreshToken,
        } as GoogleOAuth2Identifiers
    }
}