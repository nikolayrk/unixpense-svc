import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

@injectable()
export default class GoogleOAuth2IdentifiersFactory {
    public create(identifiers: GoogleOAuth2Identifiers) {
        return {
            redirectUri: identifiers.redirectUri,
            userEmail: identifiers.userEmail,
            accessToken: identifiers.accessToken,
            refreshToken: identifiers.refreshToken,
        } as GoogleOAuth2Identifiers
    }
}