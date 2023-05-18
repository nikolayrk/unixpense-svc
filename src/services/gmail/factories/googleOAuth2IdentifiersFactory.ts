import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

@injectable()
export default class GoogleOAuth2IdentifiersFactory {
    public create(redirectUri?: string, userEmail?: string, accessToken?: string, refreshToken?: string) {
        return {
            redirectUri: redirectUri ?? null,
            userEmail: userEmail ?? null,
            accessToken: accessToken ?? null,
            refreshToken: refreshToken ?? null,
        } as GoogleOAuth2Identifiers
    }
}