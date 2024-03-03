import { describe, it, beforeAll, expect } from '@jest/globals';
import GoogleOAuth2TokensRepository from '../../googleOAuth2/repositories/googleOAuth2TokensRepository';
import TransactionRepository from '../repositories/transactionRepository';
import ITransactionProvider from '../contracts/ITransactionProvider';
import { DependencyInjector } from '../../dependencyInjector';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import { injectables } from '../types/injectables';
import { registerDependencies } from '../../bootstrap';
import { TransactionExtensions } from '../extensions/transactionExtensions';
import { gmailPaymentDetailsTestCases } from '../../gmail/types/gmailPaymentDetailsTestCases';
import TransactionTestHelper from '../utils/transactionTestHelper';

describe('Transaction Extensions Tests', () => {
    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;
    let transactionRepository: TransactionRepository;
    let transactionProvider: ITransactionProvider;

    beforeAll(async () => {
        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});
        
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve(injectables.GoogleOAuth2TokensRepository);
        transactionRepository = DependencyInjector.Singleton.resolve(injectables.TransactionRepository);
        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
    });

    it('should map a random number of transactions to responses then back to models again', async () => {
        const transactions = await new TransactionTestHelper(gmailPaymentDetailsTestCases)
            .randomise()
            .resolveTransactionsAsync(transactionProvider);
        const responses = transactions.map(TransactionExtensions.toResponse);
        const models = responses.map(TransactionExtensions.toModel);

        expect(transactions).toEqual(models);
    });
});