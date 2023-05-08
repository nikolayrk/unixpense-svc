import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

@injectable()
export default class GoogleOAuth2IdentifiersFactory {
    public create(clientId: string, clientSecret: string, redirectUri?: string, userEmail?: string, accessToken?: string, refreshToken?: string) {
        return {
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: redirectUri,
            userEmail: userEmail ?? null,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
        } as GoogleOAuth2Identifiers
    }
}