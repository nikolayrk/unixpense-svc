import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

@injectable()
export default class GoogleOAuth2IdentifiersFactory {
    public create(clientId: string, clientSecret: string, userEmail?: string, accessToken?: string, refreshToken?: string) {
        return {
            clientId: clientId,
            clientSecret: clientSecret,
            userEmail: userEmail ?? null,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
        } as GoogleOAuth2Identifiers
    }
}