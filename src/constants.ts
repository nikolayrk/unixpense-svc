import PaymentDetails from "./core/types/paymentDetails";

const localOrService = (serviceName: string) =>
    process.env.NODE_ENV === 'test_integration'
        ? '0.0.0.0'
        : process.env.WITH_BRIDGE_NETWORK === '1'
            ? serviceName
            : 'localhost';

export default class Constants {
    public static DbComposeServiceName = 'db' as const;
    public static AppComposeServiceName = 'app' as const;

    public static readonly Defaults = {
        port: 8000 as const,
        mariadbHost: localOrService(this.DbComposeServiceName),
        mariadbPort: 3306 as const,
        mariadbPassword: 'password' as const,
        mariadbUser: 'root' as const,
        mariadbDatabase: 'unixpense' as const,
        containerTimeout: 5 * 1000, // 5s
    }

    public static readonly scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly'
    ] as const;

    public static readonly host = localOrService(this.AppComposeServiceName);

    public static readonly port = process.env.PORT ?? Constants.Defaults.port;

    public static readonly baseUrl = `${process.env.NODE_ENV === 'production'
        ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
        : `http://${Constants.host}:${Constants.port}`
    }`;

    public static readonly defaultRedirectUri = `${Constants.baseUrl}/api/oauthcallback` as const;

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