import { Container, interfaces } from 'inversify';
import GmailCardOperationStrategy from './services/gmail/strategies/gmailCardOperationStrategy';
import GmailTransactionProvider from './services/gmail/providers/gmailTransactionProvider';
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
import GmailStandardTransferStrategy from './services/gmail/strategies/gmailStandardTransferStrategy';
import GmailStandardFeeStrategy from './services/gmail/strategies/gmailStandardFeeStrategy';
import GmailDeskWithdrawalStrategy from './services/gmail/strategies/gmailDeskWIthdrawalStrategy';
import GmailCrossBorderTransferStrategy from './services/gmail/strategies/gmailCrossBorderTransferStrategy';
import ITransactionDataProvider from './services/contracts/ITransactionDataProvider';
import GmailTransactionDataProvider from './services/gmail/providers/gmailTransactionDataProvider';
import PaymentDetailsFactory from './services/factories/paymentDetailsFactory';
import PaymentDetailsContext from './services/contexts/paymentDetailsContext';
import ITransactionSourceProvider from './services/contracts/ITransactionSourceProvider';
import GmailTransactionSourceProvider from './services/gmail/providers/gmailTransactionSourceProvider';
import ILogger from './services/contracts/ILogger';
import WinstonLokiLogger from './services/loggers/winstonLokiLogger';
import GmailCrossBorderTransferFeeStrategy from './services/gmail/strategies/gmailCrossBorderTransferFeeStrategy';
import GoogleOAuth2Identifiers from './services/gmail/models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from './services/gmail/contracts/IUsesGoogleOAuth2';
import GoogleOAuth2IdentifierRepository from './services/gmail/repositories/googleOAuth2IdentifierRepository';
import GoogleOAuth2ClientProvider from './services/gmail/providers/googleOAuth2ClientProvider';
import GmailApiClient from './services/gmail/clients/gmailApiClient';
import GoogleOAuth2IdentifiersFactory from './services/gmail/factories/googleOAuth2IdentifiersFactory';
import ServiceContexts from './shared/enums/serviceContexts';
import ITransactionProvider from './services/contracts/ITransactionProvider';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        const container = new Container();

        this.container = container;

        container.bind<ILogger>(injectables.ILogger).to(WinstonLokiLogger).inSingletonScope();
        container.bind<PaymentDetailsFactory>(injectables.PaymentDetailsFactory).to(PaymentDetailsFactory);
        container.bind<PaymentDetailsContext>(injectables.PaymentDetailsContext).to(PaymentDetailsContext);
        container.bind<TransactionFactory>(injectables.TransactionFactory).to(TransactionFactory);
        container.bind<TransactionRepository>(injectables.TransactionRepository).to(TransactionRepository);
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

    public async generateServiceAsync<T>(
        providerIdentifier: interfaces.ServiceIdentifier<interfaces.Provider<T>>,
        ...args: any[]) {
        const provider = this.container.get<interfaces.Provider<T>>(providerIdentifier);

        return await provider(...args) as T;
    }

    public registerGmailServices() {
        this.registerServicesByContext(ServiceContexts.GMAIL);

        this.container.bind<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory).to(GoogleOAuth2IdentifiersFactory);
        this.container.bind<GoogleOAuth2IdentifierRepository>(injectables.GoogleOAuth2IdentifierRepository).to(GoogleOAuth2IdentifierRepository);
        this.container.bind<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider).to(GoogleOAuth2ClientProvider);
        this.container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient);

        this.registerGoogleServiceGenerator(injectables.GoogleOAuth2ClientProviderGenerator, injectables.GoogleOAuth2ClientProvider);
        this.registerGoogleServiceGenerator(injectables.GmailApiClientGenerator, injectables.GmailApiClient);
        this.registerGoogleServiceGenerator(injectables.GmailTransactionSourceProviderGenerator, injectables.ITransactionSourceProvider);
        this.registerGoogleServiceGenerator(injectables.GmailTransactionProviderGenerator, injectables.ITransactionProvider);
    }

    private registerServicesByContext(context: ServiceContexts) {
        switch(context) {
            case ServiceContexts.GMAIL:
                this.container.bind<ICardOperationStrategy>(injectables.ICardOperationStrategy).to(GmailCardOperationStrategy);
                this.container.bind<ICrossBorderTransferStrategy>(injectables.ICrossBorderTransferStrategy).to(GmailCrossBorderTransferStrategy);
                this.container.bind<ICrossBorderTransferFeeStrategy>(injectables.ICrossBorderTransferFeeStrategy).to(GmailCrossBorderTransferFeeStrategy);
                this.container.bind<IDeskWithdrawalStrategy>(injectables.IDeskWithdrawalStrategy).to(GmailDeskWithdrawalStrategy);
                this.container.bind<IStandardFeeStrategy>(injectables.IStandardFeeStrategy).to(GmailStandardFeeStrategy);
                this.container.bind<IStandardTransferStrategy>(injectables.IStandardTransferStrategy).to(GmailStandardTransferStrategy);
                this.container.bind<ITransactionDataProvider>(injectables.ITransactionDataProvider).to(GmailTransactionDataProvider);
                this.container.bind<ITransactionSourceProvider>(injectables.ITransactionSourceProvider).to(GmailTransactionSourceProvider);
                this.container.bind<ITransactionProvider>(injectables.ITransactionProvider).to(GmailTransactionProvider);

                break;
            default:
                throw new Error(`Unrecognised service context '${context}'`);
        }
    }

    private registerGoogleServiceGenerator = <T extends IUsesGoogleOAuth2>(
        generatorIdentifier: interfaces.ServiceIdentifier<interfaces.Provider<T>>,
        serviceIdentifier: interfaces.ServiceIdentifier<T>) => 
            this.container.bind<interfaces.Provider<T>>(generatorIdentifier)
                .toProvider((context) => {
                    return async (identifiers: GoogleOAuth2Identifiers) => {
                        const service = context.container.get<T>(serviceIdentifier);
        
                        await service.useAsync(identifiers);
        
                        return service;
                    }
                });
}