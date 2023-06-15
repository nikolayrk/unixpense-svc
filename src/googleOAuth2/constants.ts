export default class Constants {
    public static readonly scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly'
    ] as const;

    public static readonly defaultRedirectUri = `${process.env.NODE_ENV === 'production'
            ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
            : `http://${process.env.HOSTNAME ?? 'localhost'}:${process.env.port ?? 8000}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
        }/api/oauthcallback`;
}