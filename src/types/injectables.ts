export const injectables = {
    IRefreshTokenRepository: Symbol.for('IRefreshTokenRepository'),
    ITransactionRepository: Symbol.for('ITransactionRepository'),

    PaymentDetailsFactory: Symbol.for('PaymentDetailsFactory'),
    TransactionFactory: Symbol.for('TransactionFactory'),

    GoogleOAuth2ClientProvider: Symbol.for('GoogleOAuth2ClientProvider'),

    ICardOperationStrategy: Symbol.for('ICardOperationStrategy'),
    ICrossBorderTransferStrategy: Symbol.for('ICrossBorderTransferStrategy'),
    IDeskWithdrawalStrategy: Symbol.for('IDeskWithdrawalStrategy'),
    IStandardFeeStrategy: Symbol.for('IStandardFeeStrategy'),
    IStandardTransferStrategy: Symbol.for('IStandardTransferStrategy'),
    PaymentDetailsContext: Symbol.for('PaymentDetailsContext'),
    
    GmailApiClient: Symbol.for('GmailApiClient'),
    ITransactionDataProvider: Symbol.for('ITransactionDataProvider'),
    ITransactionSourceProvider: Symbol.for('ITransactionSourceProvider'),

    TransactionContext: Symbol.for('TransactionContext'),
};
