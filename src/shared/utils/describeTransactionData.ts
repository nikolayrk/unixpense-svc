import { describe, expect, test } from '@jest/globals';
import PaymentDetails from "../../shared/models/paymentDetails";
import { TransactionData, TransactionDataBody, TransactionDataHead } from '../../shared/models/transactionData';
import { PaymentDetailsTestCase } from '../../shared/types/paymentDetailsTestCase';
import { TransactionDataTestCase } from '../types/transactionDataTestCase';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../shared/types/injectables';
import ITransactionDataProvider from '../../services/contracts/ITransactionDataProvider';

export default function describeTransactionDataTests<T extends PaymentDetails>(
  name: string,
  transactionDataTestCases: TransactionDataTestCase[],
  paymentDetailsTestCases: PaymentDetailsTestCase<T>[]) {
  const paddingTop = `
          <html>
          <head>
          </head>
          <body><table cellspacing="1" cellpadding="0" border="0" width="100%" class="address">
            <tr>
              <td>
                <font size="5">
                  <b>УниКредит Булбанк</b>
                </font>
              </td>
              <td width="17%" align="right" />
            </tr>
          </table>
          <hr size="1" />
          <table cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="17%">
                <font style="font-family:Arial;font-size:10.0pt;font-weight:bold;">Дата: </font>
                <font class="style0">05.08.2022 13:05:26</font>
              </td>
            </tr>
            <tr>
              <td align="left">
                <br />
                <font style="font-family:Arial;font-size:12.0pt;font-weight:bold;">Информация за операция по сметка</font>
              </td>
            </tr>
          </table>
          <p> </p>
          <font class="style0">
            <b>Сметка</b>:
                                    
                                    01</font>
          <table cellspacing="2" cellpadding="2" border="0" width="100%" class="style0">
            <tr>
              <td> </td>
            </tr>
            <tr>
              <td class="td-header" nowrap="nowrap" width="15%">Салдо към дата 
                                                          05.08.2022 13:04:35</td>
              <td width="15%" align="left">1234.56</td>
              <td> </td>
            </tr>
          </table>
          <table bordercolor="black" cellspacing="0" cellpadding="4" width="100%" class="style0" BORDER="1" FRAME="BOX" RULES="NONE">
            <tr>
              <td class="td-header" align="center" width="15%">Дата на обработка</td>
              <td class="td-header" align="center" width="5%">Референция</td>
              <td class="td-header" align="center" width="10%">Вальор</td>
              <td class="td-header" align="right" width="5%">Сума</td>
              <td class="td-header" align="center" width="5%">Тип</td>
              <td class="td-header" align="left" width="40%">Описание</td>
              <td class="td-header" align="center" width="25%">Детайли БИСЕРА</td>
            </tr>
            <tr>
              <td colspan="7">
                <hr size="1" />
              </td>
            </tr>
            <tr>` as const;

  const paddingBottom = `
            </tr>
            <tr>
              <td colspan="7">
                <hr size="1" />
              </td>
            </tr>
            <tr>
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
              <td class="td-header" height="1" />
            </tr>
          </table>
          <br />
          </body>
          </html>` as const;

  const transactionDataProvider = DependencyInjector.Singleton.resolve<ITransactionDataProvider>(injectables.ITransactionDataProvider);

  const transactionDataFromAttachmentData = (includePadding: boolean, attachmentDataHead: string, attachmentDataBody: string) =>
    transactionDataProvider.get(
      `${includePadding
        ? `${paddingTop}${attachmentDataHead}${attachmentDataBody}${paddingBottom}`
        : `${attachmentDataHead}${attachmentDataBody}`}`);

  const constructTransactionData = (
    transactionDataHead: TransactionDataHead,
    transactionDataBody: TransactionDataBody) => { return { ...transactionDataHead, ...transactionDataBody } as TransactionData; };

  const newTransactionDataTestCase = (
    transactionDataTestCase: TransactionDataTestCase,
    paymentDetailsTestCase: PaymentDetailsTestCase<T>) =>
      test(
        `${transactionDataTestCase.testName} > ${paymentDetailsTestCase.testName}`,
        () => expect(transactionDataFromAttachmentData(
          transactionDataTestCase.includePadding,
          transactionDataTestCase.attachmentDataHead,
          paymentDetailsTestCase.attachmentDataBody))
      .toStrictEqual(constructTransactionData(
        transactionDataTestCase.expectedTransactionDataHead,
        paymentDetailsTestCase.expectedTransactionDataBody
      )));

  describe(name, () => paymentDetailsTestCases
    .forEach(paymentDetailsTestCase => transactionDataTestCases
      .forEach(transactionDataTestCase => {
        newTransactionDataTestCase(transactionDataTestCase, paymentDetailsTestCase);
      })));
}
