import { describe, it, beforeAll, expect } from '@jest/globals';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { PaymentDetailsTestCase, paymentDetailsTestCases } from '../types/paymentDetailsTestCases';
import { registerDependencies } from '../../bootstrap';
import PaymentDetails from '../../core/models/paymentDetails';
import ITransactionProvider from '../../core/contracts/ITransactionProvider';
import TransactionFactory from '../../core/factories/transactionFactory';
import { constructTransactionDataTestCase } from '../types/transactionDataTestCase';
import { TransactionData } from '../../core/models/transactionData';
import GoogleOAuth2IdentifiersFactory from '../../googleOAuth2/factories/googleOAuth2IdentifiersFactory';
import EntryType from '../../core/enums/entryType';
import TransactionType from '../../core/enums/transactionType';
import Constants from '../../constants';

describe('Gmail Transaction Provider Tests', () => {
    let transactionProvider: ITransactionProvider;

    beforeAll(async () => {
        registerDependencies();

        const googleOAuth2IdentifierFactory = DependencyInjector.Singleton.resolve<GoogleOAuth2IdentifiersFactory>(injectables.GoogleOAuth2IdentifiersFactory);
        const oauth2Identifiers = googleOAuth2IdentifierFactory.create({});

        transactionProvider = await DependencyInjector.Singleton.generateGmailServiceAsync<ITransactionProvider>(injectables.GmailTransactionProviderGenerator, oauth2Identifiers);
    });

    const describePaymentDetailsTest = (entry: [string, PaymentDetailsTestCase<PaymentDetails>]) => {
        const transactionId = entry[0];
        const testCase = entry[1];

        it(`should resolve transaction of type ${transactionId}`, async () => {
            const transactionHead = constructTransactionDataTestCase(transactionId).expectedTransactionDataHead;
            const transactionBody = testCase.expectedTransactionDataBody;
            const transactionData: TransactionData = {
                ...transactionHead,
                ...transactionBody
            };
            const paymentDetails = testCase.expectedPaymentDetails;
            const expected = TransactionFactory.create(transactionId, transactionData, paymentDetails);

            const actual = await transactionProvider.resolveTransactionAsync(transactionId);

            expect(actual).toEqual(expected);
        });
    }

    Object
        .entries(paymentDetailsTestCases)
        .map(describePaymentDetailsTest);


    it('should resolve from an empty source string', async () => {
        const expected = {
            id: Constants.Mock.emptyTransactionSourceId,
            date: new Date(NaN),
            valueDate: new Date(NaN),
            entryType: EntryType.INVALID,
            type: TransactionType.UNKNOWN,
            paymentDetails: Constants.defaultPaymentDetails
        };

        const actual = await transactionProvider.resolveTransactionAsync(Constants.Mock.emptyTransactionSourceId);

        expect(JSON.stringify(actual)).toStrictEqual(JSON.stringify(expected));
    });
});