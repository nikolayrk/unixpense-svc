import { Container, interfaces } from 'inversify';
import IRefreshTokenRepository from './contracts/IRefreshTokenRepository';
import PaymentDetailsBuilder from './builders/paymentDetailsBuilder';
import GmailTransactionBuilder from './builders/gmailTransactionBuilder';
import GmailApiClient from './clients/gmailApiClient';
import ITransactionProvider from './contracts/ITransactionProvider';
import CardOperationFactory from './factories/cardOperationFactory';
import CrossBorderTransferFactory from './factories/crossBorderTransferFactory';
import StandardFeeFactory from './factories/standardFeeFactory';
import StandardTransferFactory from './factories/standardTransferFactory';
import GmailTransactionFactory from './factories/gmailTransactionFactory';
import RefreshTokenRepository from './repositories/refreshTokenRepository';
import GoogleOAuth2ClientProvider from './providers/googleOAuth2ClientProvider';
import GmailTransactionProvider from './providers/gmailTransactionProvider';
import TransactionRepository from './repositories/transactionRepository';
import ITransactionRepository from './contracts/ITransactionRepository';
import ITransactionBuilder from './contracts/ITransactionBuilder';
import ITransactionFactory from './contracts/ITransactionFactory';
import {
    ICardOperationFactory,
    ICrossBorderTransferFactory,
    IStandardFeeFactory,
    IStandardTransferFactory
} from './contracts/IPaymentDetailsFactory';
import { injectables } from './types/injectables';

export class DependencyInjector {
    private static singleton: DependencyInjector;

    private readonly container: Container;
    
    private constructor() {
        const container = new Container();

        this.container = container;
        
        container.bind<IRefreshTokenRepository>(injectables.IRefreshTokenRepository).to(RefreshTokenRepository);
        
        container.bind<GoogleOAuth2ClientProvider>(injectables.GoogleOAuth2ClientProvider).to(GoogleOAuth2ClientProvider).inSingletonScope();
        
        container.bind<GmailApiClient>(injectables.GmailApiClient).to(GmailApiClient).inSingletonScope();
        
        container.bind<ICardOperationFactory>(injectables.ICardOperationFactory).to(CardOperationFactory);
        container.bind<ICrossBorderTransferFactory>(injectables.ICrossBorderTransferFactory).to(CrossBorderTransferFactory);
        container.bind<IStandardFeeFactory>(injectables.IStandardFeeFactory).to(StandardFeeFactory);
        container.bind<IStandardTransferFactory>(injectables.IStandardTransferFactory).to(StandardTransferFactory);
        container.bind<PaymentDetailsBuilder>(injectables.PaymentDetailsBuilder).to(PaymentDetailsBuilder)

        container.bind<ITransactionFactory>(injectables.ITransactionFactory).to(GmailTransactionFactory);
        container.bind<ITransactionBuilder>(injectables.ITransactionBuilder).to(GmailTransactionBuilder);
        container.bind<ITransactionRepository>(injectables.ITransactionRepository).to(TransactionRepository);
        container.bind<ITransactionProvider>(injectables.ITransactionProvider).to(GmailTransactionProvider);
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