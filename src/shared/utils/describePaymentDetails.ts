import {describe, expect, test} from '@jest/globals';
import PaymentDetails from "../../shared/models/paymentDetails";
import { PaymentDetailsTestCase } from '../../shared/types/paymentDetailsTestCase';
import { TransactionDataTestCase } from '../types/transactionDataTestCase';
import PaymentDetailsContext from '../../services/contexts/paymentDetailsContext';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../shared/types/injectables';

export default function describePaymentDetailsTests<T extends PaymentDetails>(
  name: string,
  transactionDataTestCases: TransactionDataTestCase[],
  paymentDetailsTestCases: PaymentDetailsTestCase<T>[]) {
  DependencyInjector.Singleton.registerGmailServices();

  const paymentDetailsContext = DependencyInjector.Singleton.resolve<PaymentDetailsContext>(injectables.PaymentDetailsContext);

  const createPaymentDetails = (paymentDetailsTestCase: PaymentDetailsTestCase<T>) =>
    paymentDetailsContext.resolve(
      paymentDetailsTestCase.testName,
      paymentDetailsTestCase.expectedTransactionDataBody.transactionType,
      paymentDetailsTestCase.expectedTransactionDataBody.paymentDetailsRaw,
      paymentDetailsTestCase.expectedTransactionDataBody.additionalDetailsRaw);

  const newPaymentDetailsTestCase = (paymentDetailsTestCase: PaymentDetailsTestCase<T>) =>
      test(paymentDetailsTestCase.testName, () =>
          expect(createPaymentDetails(paymentDetailsTestCase))
      .toStrictEqual(paymentDetailsTestCase.expectedPaymentDetails));
  
  describe(name, () => transactionDataTestCases.forEach(_ => paymentDetailsTestCases.forEach(newPaymentDetailsTestCase)));
}
