export const injectables = {
    IRefreshTokenRepository: Symbol.for('IRefreshTokenRepository'),

    GoogleOAuth2ClientProvider: Symbol.for('GoogleOAuth2ClientProvider'),

    GmailApiClient: Symbol.for('GmailApiClient'),

    ICardOperationFactory: Symbol.for('ICardOperationFactory'),
    ICrossBorderTransferFactory: Symbol.for('ICrossBorderTransferFactory'),
    IStandardFeeFactory: Symbol.for('IStandardFeeFactory'),
    IStandardTransferFactory: Symbol.for('IStandardTransferFactory'),
    PaymentDetailsBuilder: Symbol.for('PaymentDetailsBuilder'),

    ITransactionFactory: Symbol.for('ITransactionFactory'),
    ITransactionBuilder: Symbol.for('ITransactionBuilder'),
    ITransactionRepository: Symbol.for('ITransactionRepository'),
    ITransactionProvider: Symbol.for('ITransactionProvider'),
};
