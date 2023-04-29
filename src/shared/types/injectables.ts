export const injectables = {
    // Core Services
    ILogger: Symbol.for('ILogger'),
    PaymentDetailsFactory: Symbol.for('PaymentDetailsFactory'),
    PaymentDetailsContext: Symbol.for('PaymentDetailsContext'),
    TransactionFactory: Symbol.for('TransactionFactory'),
    TransactionRepository: Symbol.for('TransactionRepository'),

    // Gmail Services
    GoogleOAuth2IdentifiersFactory: Symbol.for('GoogleOAuth2IdentifiersFactory'),
    GoogleOAuth2IdentifierRepository: Symbol.for('GoogleOAuth2IdentifierRepository'),
    GoogleOAuth2ClientProvider: Symbol.for('GoogleOAuth2ClientProvider'),
    GmailApiClient: Symbol.for('GmailApiClient'),
    ICardOperationStrategy: Symbol.for('ICardOperationStrategy'),
    ICrossBorderTransferStrategy: Symbol.for('ICrossBorderTransferStrategy'),
    ICrossBorderTransferFeeStrategy: Symbol.for('ICrossBorderTransferFeeStrategy'),
    IDeskWithdrawalStrategy: Symbol.for('IDeskWithdrawalStrategy'),
    IStandardFeeStrategy: Symbol.for('IStandardFeeStrategy'),
    IStandardTransferStrategy: Symbol.for('IStandardTransferStrategy'),
    ITransactionDataProvider: Symbol.for('ITransactionDataProvider'),
    ITransactionSourceProvider: Symbol.for('ITransactionSourceProvider'),
    ITransactionProvider: Symbol.for('ITransactionProvider'),

    // Google OAuth2 Service Generators (Providers)
    GoogleOAuth2ClientProviderGenerator: Symbol.for('GoogleOAuth2ClientProviderGenerator'),
    GmailApiClientGenerator: Symbol.for('GmailApiClientGenerator'),
    GmailTransactionSourceProviderGenerator: Symbol.for('GmailTransactionSourceProviderGenerator'),
    GmailTransactionProviderGenerator: Symbol.for('GmailTransactionProviderGenerator'),
};
