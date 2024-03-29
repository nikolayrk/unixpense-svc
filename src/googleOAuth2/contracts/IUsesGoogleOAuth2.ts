import GoogleOAuth2Identifiers from "../types/googleOAuth2Identifiers";

export default interface IUsesGoogleOAuth2 {
    useOAuth2IdentifiersAsync(identifiers: GoogleOAuth2Identifiers): Promise<void>;
}