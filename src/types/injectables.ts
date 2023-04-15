export const injectables = {
    // Core services
    ILogger: Symbol.for('ILogger'),
    PaymentDetailsFactory: Symbol.for('PaymentDetailsFactory'),
    PaymentDetailsContext: Symbol.for('PaymentDetailsContext'),
    TransactionFactory: Symbol.for('TransactionFactory'),
    TransactionRepository: Symbol.for('TransactionRepository'),
    TransactionContext: Symbol.for('TransactionContext'),
    
    // Gmail-related services
    ICardOperationStrategy: Symbol.for('ICardOperationStrategy'),
    ICrossBorderTransferStrategy: Symbol.for('ICrossBorderTransferStrategy'),
    ICrossBorderTransferFeeStrategy: Symbol.for('ICrossBorderTransferFeeStrategy'),
    IDeskWithdrawalStrategy: Symbol.for('IDeskWithdrawalStrategy'),
    IStandardFeeStrategy: Symbol.for('IStandardFeeStrategy'),
    IStandardTransferStrategy: Symbol.for('IStandardTransferStrategy'),
    RefreshTokenRepository: Symbol.for('RefreshTokenRepository'),
    GoogleOAuth2ClientProvider: Symbol.for('GoogleOAuth2ClientProvider'),
    GmailApiClient: Symbol.for('GmailApiClient'),
    ITransactionDataProvider: Symbol.for('ITransactionDataProvider'),
    ITransactionSourceProvider: Symbol.for('ITransactionSourceProvider'),
};
