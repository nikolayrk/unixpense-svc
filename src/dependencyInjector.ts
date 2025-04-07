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
import GmailApiClient from './gmail/clients/gmailApiClient';
import ServiceContexts from './core/enums/serviceContexts';
import ITransactionProvider from './core/contracts/ITransactionProvider';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        this.container = new Container();

        this.registerCoreServices();
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

    public registerGmailServices() {
        this.registerServicesByContext(ServiceContexts.GMAIL);
    }

    private registerCoreServices() {
        this.container.bind<ILogger>(injectables.ILogger).to(WinstonLokiLogger).inSingletonScope();
        this.container.bind<PaymentDetailsFactory>(injectables.PaymentDetailsFactory).to(PaymentDetailsFactory);
        this.container.bind<PaymentDetailsContext>(injectables.PaymentDetailsContext).to(PaymentDetailsContext);
        this.container.bind<TransactionRepository>(injectables.TransactionRepository).to(TransactionRepository);
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
                this.container.bind<ITransactionProvider>(injectables.ITransactionProvider).to(GmailTransactionProvider);
                this.container.bind<ITransactionSourceProvider>(injectables.ITransactionSourceProvider).to(GmailTransactionSourceProvider);
                this.container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient);

                break;
            default:
                throw new Error(`Unrecognised service context '${context}'`);
        }
    }
}