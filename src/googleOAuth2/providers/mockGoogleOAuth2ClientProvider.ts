import { injectable } from "inversify";
import GoogleOAuth2Identifiers from "../models/googleOAuth2Identifiers";
import AbstractGoogleOAuth2ClientProvider from "./abstractGoogleOAuth2ClientProvider";
import { Credentials } from "google-auth-library";
import Constants from "../../constants";

@injectable()
export default class MockGoogleOAuth2ClientProvider extends AbstractGoogleOAuth2ClientProvider {
    public override get client() {
        return "";
    }

    public override async tryAuthorizeAsync(code: string) {
        switch (code) {
            case Constants.Mock.authorizationCode:
                const tokens = {
                    access_token: Constants.Mock.accessToken,
                    refresh_token: Constants.Mock.refreshToken
                };

                await this.tryHandleTokensAsync(tokens);
                
                return tokens;

            case Constants.Mock.authorizationCodeError:
                throw new Error(code);

            default:
                throw new Error("Unrecognised mock OAuth authorization code");
        }
    }

    protected override initialiseClient(identifiers: GoogleOAuth2Identifiers) { }

    protected override resolveEmailOrNullAsync = async (accessToken?: string) => Constants.Mock.userEmail;

    protected override authenticate(tokens: Credentials) { }
}