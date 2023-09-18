import PaymentDetails from "../src/core/models/paymentDetails";

export default class Constants {
    public static readonly Defaults = {
        port: 8000,
        mariadbPort: 3306,
        mariadbPassword: 'password',
        mariadbUser: 'root',
        mariadbDatabase: 'unixpense',
        containerTimeout: 30 * 1000 // 30s
    }

    public static readonly scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly'
    ] as const;

    public static readonly host = `${process.env.NODE_ENV === 'production'
        ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
        : `http://localhost:${process.env.PORT ?? Constants.Defaults.port}`
    }`;

    public static readonly defaultRedirectUri = `${Constants.host}/api/oauthcallback` as const;

    public static readonly Mock = {
        userEmail: "email",
        clientId: "client_id",
        clientSecret: "client_secret",
        redirectUri: "redirect_uri",
        authorizationCode: "code",
        authorizationCodeError: "error_code",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        emptyTransactionSourceId: "empty",
        errorTransactionSourceId: "error"
    } as const;

    public static readonly defaultPaymentDetails: PaymentDetails = {
        recipient: '<N/A>'
    };
}