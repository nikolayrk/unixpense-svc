import { describe, it, beforeAll, expect } from '@jest/globals';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import EntryType from '../../core/enums/entryType';
import TransactionType from '../../core/enums/transactionType';
import Constants from '../../constants';
import { gmailPaymentDetailsTestCases } from '../types/gmailPaymentDetailsTestCases';
import ITransactionDataProvider from '../../core/contracts/ITransactionDataProvider';
import TransactionTestHelper from '../../core/utils/transactionTestHelper';
import PaymentDetailsContext from '../../core/contexts/paymentDetailsContext';

describe('Gmail Transaction Data Provider Tests', () => {
    const gmailTransactionTestHelper = new TransactionTestHelper()
        .withTestCases(gmailPaymentDetailsTestCases)
        .useGmailContext();

    let transactionDataProvider: ITransactionDataProvider;
    let paymentDetailsContext: PaymentDetailsContext;

    beforeAll(async () => {
        DependencyInjector.Singleton.registerGmailServices();
        
        transactionDataProvider = DependencyInjector.Singleton.resolve<ITransactionDataProvider>(injectables.ITransactionDataProvider);
        paymentDetailsContext = DependencyInjector.Singleton.resolve<PaymentDetailsContext>(injectables.PaymentDetailsContext);
    });

    Object.entries(gmailPaymentDetailsTestCases).map(([ transactionId, _ ]) =>
        it(`should resolve transaction data for transaction of type ${transactionId}`, async () => {
            const transactionDataSource = gmailTransactionTestHelper.resolveTransactionDataSource(transactionId, false);
            
            const actualTransactionData = transactionDataProvider.get(transactionDataSource);
            const actualPaymentDetails = paymentDetailsContext.resolve(
                actualTransactionData.reference,
                actualTransactionData.transactionType,
                actualTransactionData.paymentDetailsRaw,
                actualTransactionData.additionalDetailsRaw);

            const expectedTransactionData = gmailTransactionTestHelper.resolveTransactionData(transactionId);
            const expectedPaymentDetails = gmailTransactionTestHelper.resolvePaymentDetails(transactionId);

            expect(actualTransactionData).toEqual(expectedTransactionData);
            expect(actualPaymentDetails).toEqual(expectedPaymentDetails);
        }));


    it('should resolve from an empty source string', async () => {
        const actual = transactionDataProvider.get(Constants.Mock.emptyTransactionSourceId);

        expect(JSON.stringify(actual)).toStrictEqual(JSON.stringify({
            date: new Date(NaN),
            reference: undefined,
            sum: undefined,
            valueDate: new Date(NaN),
            entryType: EntryType.INVALID,
            transactionType: TransactionType.UNKNOWN,
            paymentDetailsRaw: undefined,
            additionalDetailsRaw: [],
        }));
    });
});