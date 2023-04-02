import { Container, interfaces } from 'inversify';
import GmailApiClient from './strategies/gmail/clients/gmailApiClient';
import GmailCardOperationStrategy from './strategies/gmail/gmailCardOperationStrategy';
import RefreshTokenRepository from './strategies/gmail/repositories/refreshTokenRepository';
import GoogleOAuth2ClientProvider from './strategies/gmail/providers/googleOAuth2ClientProvider';
import TransactionContext from './contexts/transactionContext';
import TransactionRepository from './repositories/transactionRepository';
import {
    ICardOperationStrategy,
    ICrossBorderTransferStrategy,
    IDeskWithdrawalStrategy,
    IStandardFeeStrategy,
    IStandardTransferStrategy
} from "./types/paymentDetailsStrategies";
import { injectables } from './types/injectables';
import TransactionFactory from './factories/transactionFactory';
import GmailStandardTransferStrategy from './strategies/gmail/gmailStandardTransferStrategy';
import GmailStandardFeeStrategy from './strategies/gmail/gmailStandardFeeStrategy';
import GmailDeskWithdrawalStrategy from './strategies/gmail/gmailDeskWIthdrawalStrategy';
import GmailCrossBorderTransferStrategy from './strategies/gmail/gmailCrossBorderTransferStrategy';
import ITransactionDataProvider from './contracts/ITransactionDataProvider';
import GmailTransactionDataProvider from './strategies/gmail/providers/gmailTransactionDataProvider';
import PaymentDetailsFactory from './factories/paymentDetailsFactory';
import PaymentDetailsContext from './contexts/paymentDetailsContext';
import ITransactionSourceProvider from './contracts/ITransactionSourceProvider';
import GmailTransactionSourceProvider from './strategies/gmail/providers/gmailTransactionSourceProvider';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        const container = new Container();

        this.container = container;

        // Core services
        container.bind<PaymentDetailsFactory>(injectables.PaymentDetailsFactory).to(PaymentDetailsFactory);
        container.bind<PaymentDetailsContext>(injectables.PaymentDetailsContext).to(PaymentDetailsContext);
        container.bind<TransactionFactory>(injectables.TransactionFactory).to(TransactionFactory);
        container.bind<TransactionRepository>(injectables.TransactionRepository).to(TransactionRepository);
        container.bind<TransactionContext>(injectables.TransactionContext).to(TransactionContext);
        
        // Gmail-related services
        container.bind<ICardOperationStrategy>(injectables.ICardOperationStrategy).to(GmailCardOperationStrategy);
        container.bind<ICrossBorderTransferStrategy>(injectables.ICrossBorderTransferStrategy).to(GmailCrossBorderTransferStrategy);
        container.bind<IDeskWithdrawalStrategy>(injectables.IDeskWithdrawalStrategy).to(GmailDeskWithdrawalStrategy);
        container.bind<IStandardFeeStrategy>(injectables.IStandardFeeStrategy).to(GmailStandardFeeStrategy);
        container.bind<IStandardTransferStrategy>(injectables.IStandardTransferStrategy).to(GmailStandardTransferStrategy);
        container.bind<RefreshTokenRepository>(injectables.RefreshTokenRepository).to(RefreshTokenRepository);
        container.bind<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider).to(GoogleOAuth2ClientProvider).inSingletonScope();
        container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient).inSingletonScope();
        container.bind<ITransactionDataProvider>(injectables.ITransactionDataProvider).to(GmailTransactionDataProvider);
        container.bind<ITransactionSourceProvider>(injectables.ITransactionSourceProvider).to(GmailTransactionSourceProvider);
    }

    public static get Singleton() {
        if (this.singleton === undefined) {
            this.singleton = new this();
        }

        return this.singleton;
    }

    public resolve<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
        return this.container.get<T>(serviceIdentifier);
    }
}