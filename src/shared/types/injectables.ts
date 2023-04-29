export const injectables = {
    // Core Services
    ILogger: Symbol.for('ILogger'),
    PaymentDetailsFactory: Symbol.for('PaymentDetailsFactory'),
    ICardOperationStrategy: Symbol.for('ICardOperationStrategy'),
    ICrossBorderTransferStrategy: Symbol.for('ICrossBorderTransferStrategy'),
    ICrossBorderTransferFeeStrategy: Symbol.for('ICrossBorderTransferFeeStrategy'),
    IDeskWithdrawalStrategy: Symbol.for('IDeskWithdrawalStrategy'),
    IStandardFeeStrategy: Symbol.for('IStandardFeeStrategy'),
    IStandardTransferStrategy: Symbol.for('IStandardTransferStrategy'),
    PaymentDetailsContext: Symbol.for('PaymentDetailsContext'),
    TransactionFactory: Symbol.for('TransactionFactory'),
    TransactionRepository: Symbol.for('TransactionRepository'),
    ITransactionDataProvider: Symbol.for('ITransactionDataProvider'),
    ITransactionSourceProvider: Symbol.for('ITransactionSourceProvider'),
    TransactionContext: Symbol.for('TransactionContext'),
    
    // Gmail Context Services
    GoogleOAuth2IdentifiersFactory: Symbol.for('GoogleOAuth2IdentifiersFactory'),
    GoogleOAuth2IdentifierRepository: Symbol.for('GoogleOAuth2IdentifierRepository'),
    GoogleOAuth2ClientProvider: Symbol.for('GoogleOAuth2ClientProvider'),
    GmailApiClient: Symbol.for('GmailApiClient'),

    // Gmail Context Service Factories
    GoogleOAuth2ClientProviderGenerator: Symbol.for('GoogleOAuth2ClientProviderGenerator'),
    GmailApiClientGenerator: Symbol.for('GmailApiClientGenerator'),
    GmailTransactionSourceProviderGenerator: Symbol.for('GmailTransactionSourceProviderGenerator'),
    TransactionContextGenerator: Symbol.for('TransactionContextGenerator'),
};
