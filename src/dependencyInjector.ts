import { Container, interfaces } from 'inversify';
import IRefreshTokenRepository from './contracts/IRefreshTokenRepository';
import GmailApiClient from './clients/gmailApiClient';
import GmailCardOperationStrategy from './strategies/gmailCardOperationStrategy';
import RefreshTokenRepository from './repositories/refreshTokenRepository';
import GoogleOAuth2ClientProvider from './providers/googleOAuth2ClientProvider';
import TransactionContext from './contexts/transactionContext';
import TransactionRepository from './repositories/transactionRepository';
import ITransactionRepository from './contracts/ITransactionRepository';
import {
    ICardOperationStrategy,
    ICrossBorderTransferStrategy,
    IDeskWithdrawalStrategy,
    IStandardFeeStrategy,
    IStandardTransferStrategy
} from "./types/paymentDetailsStrategies";
import { injectables } from './types/injectables';
import TransactionFactory from './factories/transactionFactory';
import GmailStandardTransferStrategy from './strategies/gmailStandardTransferStrategy';
import GmailStandardFeeStrategy from './strategies/gmailStandardFeeStrategy';
import GmailDeskWithdrawalStrategy from './strategies/gmailDeskWIthdrawalStrategy';
import GmailCrossBorderTransferStrategy from './strategies/gmailCrossBorderTransferStrategy';
import ITransactionDataProvider from './contracts/ITransactionDataProvider';
import GmailTransactionDataProvider from './providers/gmailTransactionDataProvider';
import PaymentDetailsFactory from './factories/paymentDetailsFactory';
import PaymentDetailsContext from './contexts/paymentDetailsContext';
import ITransactionSourceProvider from './contracts/ITransactionSourceProvider';
import GmailTransactionSourceProvider from './providers/gmailTransactionSourceProvider';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        const container = new Container();

        this.container = container;
        
        container.bind<IRefreshTokenRepository>(injectables.IRefreshTokenRepository).to(RefreshTokenRepository);
        container.bind<ITransactionRepository>(injectables.ITransactionRepository).to(TransactionRepository);

        container.bind<PaymentDetailsFactory>(injectables.PaymentDetailsFactory).to(PaymentDetailsFactory);
        container.bind<TransactionFactory>(injectables.TransactionFactory).to(TransactionFactory);
        
        container.bind<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider).to(GoogleOAuth2ClientProvider).inSingletonScope();
        
        container.bind<ICardOperationStrategy>(injectables.ICardOperationStrategy).to(GmailCardOperationStrategy);
        container.bind<ICrossBorderTransferStrategy>(injectables.ICrossBorderTransferStrategy).to(GmailCrossBorderTransferStrategy);
        container.bind<IDeskWithdrawalStrategy>(injectables.IDeskWithdrawalStrategy).to(GmailDeskWithdrawalStrategy);
        container.bind<IStandardFeeStrategy>(injectables.IStandardFeeStrategy).to(GmailStandardFeeStrategy);
        container.bind<IStandardTransferStrategy>(injectables.IStandardTransferStrategy).to(GmailStandardTransferStrategy);
        container.bind<PaymentDetailsContext>(injectables.PaymentDetailsContext).to(PaymentDetailsContext);

        container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient).inSingletonScope();
        container.bind<ITransactionDataProvider>(injectables.ITransactionDataProvider).to(GmailTransactionDataProvider);
        container.bind<ITransactionSourceProvider>(injectables.ITransactionSourceProvider).to(GmailTransactionSourceProvider);

        container.bind<TransactionContext>(injectables.TransactionContext).to(TransactionContext);
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