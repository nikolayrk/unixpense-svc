import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";

export default interface IUsesGoogleOAuth2 {
    useAsync(identifiers: GoogleOAuth2Identifiers): Promise<void>;
}