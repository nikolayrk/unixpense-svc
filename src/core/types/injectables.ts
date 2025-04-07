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
    GmailApiClient: Symbol.for('GmailApiClient'),
};
