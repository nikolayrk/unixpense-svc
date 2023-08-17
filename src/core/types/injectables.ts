export const injectables = {
    // Core Services
    ILogger: Symbol.for('ILogger'),
    PaymentDetailsFactory: Symbol.for('PaymentDetailsFactory'),
    PaymentDetailsContext: Symbol.for('PaymentDetailsContext'),
    TransactionRepository: Symbol.for('TransactionRepository'),

    // Contextual Services
    ICardOperationStrategy: Symbol.for('ICardOperationStrategy'),
    ICrossBorderTransferStrategy: Symbol.for('ICrossBorderTransferStrategy'),
    ICrossBorderTransferFeeStrategy: Symbol.for('ICrossBorderTransferFeeStrategy'),
    IDeskWithdrawalStrategy: Symbol.for('IDeskWithdrawalStrategy'),
    IStandardFeeStrategy: Symbol.for('IStandardFeeStrategy'),
    IStandardTransferStrategy: Symbol.for('IStandardTransferStrategy'),
    ITransactionDataProvider: Symbol.for('ITransactionDataProvider'),
    ITransactionSourceProvider: Symbol.for('ITransactionSourceProvider'),
    ITransactionProvider: Symbol.for('ITransactionProvider'),

    // Gmail Services
    GoogleOAuth2IdentifiersFactory: Symbol.for('GoogleOAuth2IdentifiersFactory'),
    GoogleOAuth2TokensRepository: Symbol.for('GoogleOAuth2TokensRepository'),
    IOAuth2ClientProvider: Symbol.for('IOAuth2ClientProvider'),
    GmailApiClient: Symbol.for('GmailApiClient'),

    // Google OAuth2 Service Generators (Providers)
    GoogleOAuth2ClientProviderGenerator: Symbol.for('GoogleOAuth2ClientProviderGenerator'),
    GmailApiClientGenerator: Symbol.for('GmailApiClientGenerator'),
    GmailTransactionSourceProviderGenerator: Symbol.for('GmailTransactionSourceProviderGenerator'),
    GmailTransactionProviderGenerator: Symbol.for('GmailTransactionProviderGenerator'),
};
