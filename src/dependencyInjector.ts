import { Container, interfaces } from 'inversify';
import GmailApiClient from './services/clients/gmailApiClient';
import GmailCardOperationStrategy from './services/strategies/gmail/gmailCardOperationStrategy';
import RefreshTokenRepository from './database/repositories/refreshTokenRepository';
import GoogleOAuth2ClientProvider from './services/providers/googleOAuth2ClientProvider';
import TransactionContext from './services/contexts/transactionContext';
import TransactionRepository from './database/repositories/transactionRepository';
import {
    ICardOperationStrategy,
    ICrossBorderTransferFeeStrategy,
    ICrossBorderTransferStrategy,
    IDeskWithdrawalStrategy,
    IStandardFeeStrategy,
    IStandardTransferStrategy
} from "./shared/types/paymentDetailsStrategies";
import { injectables } from './shared/types/injectables';
import TransactionFactory from './services/factories/transactionFactory';
import GmailStandardTransferStrategy from './services/strategies/gmail/gmailStandardTransferStrategy';
import GmailStandardFeeStrategy from './services/strategies/gmail/gmailStandardFeeStrategy';
import GmailDeskWithdrawalStrategy from './services/strategies/gmail/gmailDeskWIthdrawalStrategy';
import GmailCrossBorderTransferStrategy from './services/strategies/gmail/gmailCrossBorderTransferStrategy';
import ITransactionDataProvider from './services/contracts/ITransactionDataProvider';
import GmailTransactionDataProvider from './services/strategies/gmail/providers/gmailTransactionDataProvider';
import PaymentDetailsFactory from './services/factories/paymentDetailsFactory';
import PaymentDetailsContext from './services/contexts/paymentDetailsContext';
import ITransactionSourceProvider from './services/contracts/ITransactionSourceProvider';
import GmailTransactionSourceProvider from './services/strategies/gmail/providers/gmailTransactionSourceProvider';
import ILogger from './services/contracts/ILogger';
import WinstonLokiLogger from './services/loggers/winstonLokiLogger';
import GmailCrossBorderTransferFeeStrategy from './services/strategies/gmail/gmailCrossBorderTransferFeeStrategy';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        const container = new Container();

        this.container = container;

        // Core services
        container.bind<ILogger>(injectables.ILogger).to(WinstonLokiLogger).inSingletonScope();
        container.bind<PaymentDetailsFactory>(injectables.PaymentDetailsFactory).to(PaymentDetailsFactory);
        container.bind<PaymentDetailsContext>(injectables.PaymentDetailsContext).to(PaymentDetailsContext);
        container.bind<TransactionFactory>(injectables.TransactionFactory).to(TransactionFactory);
        container.bind<TransactionRepository>(injectables.TransactionRepository).to(TransactionRepository);
        container.bind<TransactionContext>(injectables.TransactionContext).to(TransactionContext);
        
        // Gmail-related services
        container.bind<ICardOperationStrategy>(injectables.ICardOperationStrategy).to(GmailCardOperationStrategy);
        container.bind<ICrossBorderTransferStrategy>(injectables.ICrossBorderTransferStrategy).to(GmailCrossBorderTransferStrategy);
        container.bind<ICrossBorderTransferFeeStrategy>(injectables.ICrossBorderTransferFeeStrategy).to(GmailCrossBorderTransferFeeStrategy);
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