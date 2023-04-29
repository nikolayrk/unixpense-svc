import GoogleOAuth2Identifiers from "../../shared/models/googleOAuth2Identifiers";

export default interface IUsesGoogleOAuth2 {
    useAsync(identifiers: GoogleOAuth2Identifiers): Promise<void>;
}