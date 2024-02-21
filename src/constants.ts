import PaymentDetails from "./core/types/paymentDetails";

export default class Constants {
    public static readonly Defaults = {
        port: 8000 as const,
        mariadbPort: 3306 as const,
        mariadbPassword: 'password' as const,
        mariadbUser: 'root' as const,
        mariadbDatabase: 'unixpense' as const,
        containerTimeout: 60 * 1000 // 60s
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
        userEmail: "email" as const,
        clientId: "client_id" as const,
        clientSecret: "client_secret" as const,
        redirectUri: "redirect_uri" as const,
        authorizationCode: "code" as const,
        authorizationCodeError: "error_code" as const,
        accessToken: "access_token" as const,
        refreshToken: "refresh_token" as const,
        emptyTransactionSourceId: "empty" as const,
        errorTransactionSourceId: "error" as const
    } as const;

    public static readonly defaultPaymentDetails: PaymentDetails = {
        recipient: '<N/A>'
    };

    public static readonly defaultTransactionCount: number = 25;
}