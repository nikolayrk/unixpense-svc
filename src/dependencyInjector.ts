import { Container, interfaces } from 'inversify';
import GmailCardOperationStrategy from './gmail/strategies/gmailCardOperationStrategy';
import GmailTransactionProvider from './gmail/providers/gmailTransactionProvider';
import TransactionRepository from './core/repositories/transactionRepository';
import {
    ICardOperationStrategy,
    ICrossBorderTransferFeeStrategy,
    ICrossBorderTransferStrategy,
    IDeskWithdrawalStrategy,
    IStandardFeeStrategy,
    IStandardTransferStrategy
} from "./core/types/paymentDetailsStrategies";
import { injectables } from './core/types/injectables';
import TransactionFactory from './core/factories/transactionFactory';
import GmailStandardTransferStrategy from './gmail/strategies/gmailStandardTransferStrategy';
import GmailStandardFeeStrategy from './gmail/strategies/gmailStandardFeeStrategy';
import GmailDeskWithdrawalStrategy from './gmail/strategies/gmailDeskWIthdrawalStrategy';
import GmailCrossBorderTransferStrategy from './gmail/strategies/gmailCrossBorderTransferStrategy';
import ITransactionDataProvider from './core/contracts/ITransactionDataProvider';
import GmailTransactionDataProvider from './gmail/providers/gmailTransactionDataProvider';
import PaymentDetailsFactory from './core/factories/paymentDetailsFactory';
import PaymentDetailsContext from './core/contexts/paymentDetailsContext';
import ITransactionSourceProvider from './core/contracts/ITransactionSourceProvider';
import GmailTransactionSourceProvider from './gmail/providers/gmailTransactionSourceProvider';
import ILogger from './core/contracts/ILogger';
import WinstonLokiLogger from './core/loggers/winstonLokiLogger';
import GmailCrossBorderTransferFeeStrategy from './gmail/strategies/gmailCrossBorderTransferFeeStrategy';
import GoogleOAuth2Identifiers from './googleOAuth2/models/googleOAuth2Identifiers';
import IUsesGoogleOAuth2 from './googleOAuth2/contracts/IUsesGoogleOAuth2';
import GoogleOAuth2TokensRepository from './googleOAuth2/repositories/googleOAuth2TokensRepository';
import GoogleOAuth2ClientProvider from './googleOAuth2/providers/googleOAuth2ClientProvider';
import GmailApiClient from './gmail/clients/gmailApiClient';
import GoogleOAuth2IdentifiersFactory from './googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import ServiceContexts from './core/enums/serviceContexts';
import ITransactionProvider from './core/contracts/ITransactionProvider';

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

    public generateServiceAsync<T>(
        providerIdentifier: interfaces.ServiceIdentifier<interfaces.Provider<T>>,
        ...args: any[]) {
        const provider = this.container.get<interfaces.Provider<T>>(providerIdentifier);

        return provider(...args) as Promise<T>;
    }

    public registerGmailServices() {
        this.registerServicesByContext(ServiceContexts.GMAIL);

        this.container.bind<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory).to(GoogleOAuth2IdentifiersFactory);
        this.container.bind<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository).to(GoogleOAuth2TokensRepository);
        this.container.bind<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider).to(GoogleOAuth2ClientProvider).inRequestScope();
        this.container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient).inRequestScope();

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
        
                        await service.useOAuth2IdentifiersAsync(identifiers);
        
                        return service;
                    }
                });
}