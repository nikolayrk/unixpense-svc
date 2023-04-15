import TransactionType from "../../../enums/transactionType";
import StandardTransfer from "../../../models/standardTransfer";
import { PaymentDetailsTestCase } from "./types/paymentDetailsTestCase";

export const standardTransferTestCases: PaymentDetailsTestCase<StandardTransfer>[] = [
  {   testName: 'INTEREST_PAYMENT', // Credit
      attachmentDataBody: `
        <td nowrap="" align="left">Плащане на лихва<br><br>Плащане на лихва 70001234567820 BGN .25<br></td>
        <td align="center">
        <table>
            <tbody><tr>
                <td align="right" nowrap="">NA</td>
            </tr>
            <tr>
                <td align="right" nowrap="">UNICREDIT BULBANK</td>
            </tr>
        </tbody></table>
        </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INTEREST_PAYMENT,
          paymentDetailsRaw: [ '70001234567820 BGN .25' ],
          additionalDetailsRaw: [
            'NA',
            'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN .25',
      }
  },
  {   testName: 'INTEREST_TAX', // Debit
      attachmentDataBody: `
          <td nowrap="" align="left">Удържане на данък в/у лихва<br><br>Удържане на данък в/у лихва 70001234567820 BGN .02<br></td>
          <td align="center">
            <table width="100%">
              <tbody><tr>
                <td align="right" nowrap="">NA</td>
              </tr>
              <tr>
                <td align="right" nowrap="">UNICREDIT BULBANK</td>
              </tr>
            </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INTEREST_TAX,
          paymentDetailsRaw: [ '70001234567820 BGN .02' ],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN .02'
      }
  },
  {   testName: 'PRINCIPAL_REPAYMENT', // Debit
      attachmentDataBody: `
          <td nowrap="" align="left">Погасяване на главница<br><br>Погасяване на главница 70001234567820 BGN 1234.56<br></td>
          <td align="center">
            <table width="100%">
              <tbody><tr>
                <td align="right" nowrap="">NA</td>
              </tr>
              <tr>
                <td align="right" nowrap="">UNICREDIT BULBANK</td>
              </tr>
            </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.PRINCIPAL_REPAYMENT,
          paymentDetailsRaw: [ '70001234567820 BGN 1234.56' ],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 1234.56'
      }
  },
  {   testName: 'INSURANCE_PREMIUM', // Debit
      attachmentDataBody: `
          <td nowrap="" align="left">Застрахователна премия<br><br>Застрахователна премия 70001234567820 BGN 1.23<br></td>
          <td align="center">
            <table width="100%">
              <tbody><tr>
                <td align="right" nowrap="">NA</td>
              </tr>
              <tr>
                <td align="right" nowrap="">UNICREDIT BULBANK</td>
              </tr>
            </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INSURANCE_PREMIUM,
          paymentDetailsRaw: [ '70001234567820 BGN 1.23' ],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 1.23'
      }
  },
  {   testName: 'INTEREST_REPAYMENT', // Debit
      attachmentDataBody: `
          <td nowrap="" align="left">Погасяв.на л-ва за редовна главница<br><br>Погасяв.на л-ва за редовна главница 70001234567820 BGN 4.56<br></td>
          <td align="center">
            <table width="100%">
              <tbody><tr>
                <td align="right" nowrap="">NA</td>
              </tr>
              <tr>
                <td align="right" nowrap="">UNICREDIT BULBANK</td>
              </tr>
            </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INTEREST_REPAYMENT,
          paymentDetailsRaw: [ '70001234567820 BGN 4.56' ],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 4.56'
      }
  },
    {   testName: 'INTERNAL_TRANSFER > Вътрешно банков превод Payroll', // Credit
        attachmentDataBody: `
            <td nowrap="" align="left">Вътрешно банков превод Payroll<br><br>Example description<br></td>
            <td align="center">
              <table>
                <tbody><tr>
                  <td align="right" nowrap="">BG69UNCR70001512345693</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">Example account name</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERNAL_TRANSFER,
            paymentDetailsRaw: [ 'Example description' ],
            additionalDetailsRaw: [
                'BG69UNCR70001512345693',
                'Example account name'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'Example account name',
            recipientIban: 'BG69UNCR70001512345693',
            description: 'Example description',
        }
    },
    {   testName: 'INTERNAL_TRANSFER > Вътрешнобанков превод FC', // Credit
        attachmentDataBody: `
            <td nowrap="" align="left">Вътрешнобанков превод FC<br><br>savings transfer<br></td>
            <td align="center">
              <table width="100%">
                <tbody><tr>
                  <td align="right" nowrap="">BG52UNCR70001234567892</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">ИВАН ИВАНОВ ИВАНОВ</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERNAL_TRANSFER,
            paymentDetailsRaw: [ 'savings transfer' ],
            additionalDetailsRaw: [
                'BG52UNCR70001234567892',
                'ИВАН ИВАНОВ ИВАНОВ'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ИВАН ИВАНОВ ИВАНОВ',
            recipientIban: 'BG52UNCR70001234567892',
            description: 'savings transfer'
        }
    },
    {   testName: 'INTERNAL_TRANSFER > Вътрешнобанков превод', // Credit
        attachmentDataBody: `
            <td nowrap="" align="left">Вътрешнобанков превод<br><br><br></td>
            <td align="center">
              <table>
                <tbody><tr>
                  <td align="right" nowrap="">BG52UNCR70001234567892</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">ИВАН ИВАНОВ ИВАНОВ</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERNAL_TRANSFER,
            paymentDetailsRaw: [],
            additionalDetailsRaw: [
                'BG52UNCR70001234567892',
                'ИВАН ИВАНОВ ИВАНОВ'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ИВАН ИВАНОВ ИВАНОВ',
            recipientIban: 'BG52UNCR70001234567892',
            description: ''
        }
    },
    {   testName: 'INTERNAL_TRANSFER > Издаден вътр.банков превод', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Издаден вътр.банков превод<br><br>Задължения на Иван Иванов към дата: 1.12.2022 г.<br></td>
            <td align="center">
              <table width="100%">
                <tbody><tr>
                  <td align="right" nowrap="">BG81UNCR70001234567820</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">Example account name</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERNAL_TRANSFER,
            paymentDetailsRaw: [ 'Задължения на Иван Иванов към дата: 1.12.2022 г.' ],
            additionalDetailsRaw: [
                'BG81UNCR70001234567820',
                'Example account name'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'Example account name',
            recipientIban: 'BG81UNCR70001234567820',
            description: 'Задължения на Иван Иванов към дата: 1.12.2022 г.'
        }
    },
    {   testName: 'INTERBANK_TRANSFER', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Платежно нареждане извън банката<br><br>Example description</td>
            <td align="center">
              <table width="100%">
                <tbody><tr>
                  <td align="right" nowrap="">BG87ESPY40041234567810</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">Example account name</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.INTERBANK_TRANSFER,
            paymentDetailsRaw: [
                'Example description'
            ],
            additionalDetailsRaw: [
                'BG87ESPY40041234567810',
                'Example account name'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'Example account name',
            recipientIban: 'BG87ESPY40041234567810',
            description: 'Example description'
        }
    },
    {   testName: 'UTILITY_PAYMENT > Комунално плащане mBanking', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Комунално плащане mBanking<br><br>ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.<wbr>2020<br></td>
            <td align="center">
              <table width="100%">
                <tbody><tr>
                  <td align="right" nowrap="">BG81UNCR763044444CEZEL</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.UTILITY_PAYMENT,
            paymentDetailsRaw: [ 'ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.2020' ],
            additionalDetailsRaw: [
                'BG81UNCR763044444CEZEL',
                'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД',
            recipientIban: 'BG81UNCR763044444CEZEL',
            description: 'ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.2020'
        }
    },
    {   testName: 'UTILITY_PAYMENT > Комунално плащане', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Комунално плaщане<br><br>Софийска Вода АД аб.номер 1001234588,2000123493<br></td>
            <td align="center">
            <table width="100%">
                <tbody><tr>
                    <td align="right" nowrap="">BG29UNCR76301005587757</td>
                </tr>
                <tr>
                    <td align="right" nowrap="">УНИКРЕДИТ БУЛБАНК СВЕТА НЕДЕЛЯ</td>
                </tr>
            </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.UTILITY_PAYMENT,
            paymentDetailsRaw: [ 'Софийска Вода АД аб.номер 1001234588,2000123493' ],
            additionalDetailsRaw: [
                'BG29UNCR76301005587757',
                'УНИКРЕДИТ БУЛБАНК СВЕТА НЕДЕЛЯ'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'УНИКРЕДИТ БУЛБАНК СВЕТА НЕДЕЛЯ',
            recipientIban: 'BG29UNCR76301005587757',
            description: 'Софийска Вода АД аб.номер 1001234588,2000123493',
        }
    },
    {   testName: 'UTILITY_PAYMENT > Комунално плащане BBO', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Комунално плащане BBO<br><br>ЧЕЗ единични плащания 310123456795 271234596/09.07.2021/09.07.<wbr>2021<br></td>
            <td align="center">
              <table width="100%">
                <tbody><tr>
                  <td align="right" nowrap="">BG81UNCR763044444CEZEL</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.UTILITY_PAYMENT,
            paymentDetailsRaw: [
                'ЧЕЗ единични плащания 310123456795 271234596/09.07.2021/09.07.2021'
            ],
            additionalDetailsRaw: [
                'BG81UNCR763044444CEZEL',
                'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД',
            recipientIban: 'BG81UNCR763044444CEZEL',
            description: 'ЧЕЗ единични плащания 310123456795 271234596/09.07.2021/09.07.2021'
        }
    },
    {   testName: 'RECEIVED_INTERBANK_TRANSFER', // Credit
        attachmentDataBody: `
            <td nowrap="" align="left">Получен междубанков превод<br><br>BGCOD RETURN 213123442 .<br></td>
            <td align="center">
              <table>
                <tbody><tr>
                  <td align="right" nowrap="">BG95INGB91451000000815</td>
                </tr>
                <tr>
                  <td align="right" nowrap="">ABOUT YOU SE . CO. KG</td>
                </tr>
              </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.RECEIVED_INTERBANK_TRANSFER,
            paymentDetailsRaw: [ 'BGCOD RETURN 213123442 .' ],
            additionalDetailsRaw: [
                'BG95INGB91451000000815',
                'ABOUT YOU SE . CO. KG'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ABOUT YOU SE . CO. KG',
            recipientIban: 'BG95INGB91451000000815',
            description: 'BGCOD RETURN 213123442 .'
        }
    },
    {   testName: 'RECEIVED_INTERNAL_PAYMENT', // Credit
        attachmentDataBody: `
            <td nowrap="" align="left">Получен вътр.банков превод<br><br>Example description<br></td>
            <td align="center">
            <table>
                <tbody><tr>
                    <td align="right" nowrap="">BG69UNCR70001512345693</td>
                </tr>
                <tr>
                    <td align="right" nowrap="">Example account name</td>
                </tr>
            </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.RECEIVED_INTERNAL_PAYMENT,
            paymentDetailsRaw: [ 'Example description' ],
            additionalDetailsRaw: [
                'BG69UNCR70001512345693',
                'Example account name'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'Example account name',
            recipientIban: 'BG69UNCR70001512345693',
            description: 'Example description',
        }
    },
    {   testName: 'PERIODIC_PAYMENT', // Debit
        attachmentDataBody: `
            <td nowrap="" align="left">Периодично плащане<br><br>Винетен стикер - СА1234KK<br></td>
            <td align="center">
            <table width="100%">
                <tbody><tr>
                    <td align="right" nowrap="">BG60SOMB91301024910104</td>
                </tr>
                <tr>
                    <td align="right" nowrap="">ИВАН ИВАНОВ ИВАНОВ</td>
                </tr>
            </tbody></table>
            </td>`,
        expectedTransactionDataBody: {
            transactionType: TransactionType.PERIODIC_PAYMENT,
            paymentDetailsRaw: [ 'Винетен стикер - СА1234KK' ],
            additionalDetailsRaw: [
                'BG60SOMB91301024910104',
                'ИВАН ИВАНОВ ИВАНОВ'
            ]
        },
        expectedPaymentDetails: {
            recipient: 'ИВАН ИВАНОВ ИВАНОВ',
            recipientIban: 'BG60SOMB91301024910104',
            description: 'Винетен стикер - СА1234KK',
        }
    },
];
      
export default standardTransferTestCases;