import Constants from "../../constants";
import TransactionType from "../../core/enums/transactionType";
import CardOperation from "../../core/types/cardOperation";
import CrossBorderTransfer from "../../core/types/crossBorderTransfer";
import CrossBorderTransferFee from "../../core/types/crossBorderTransferFee";
import DeskWithdrawal from "../../core/types/deskWithdrawal";
import PaymentDetails from "../../core/types/paymentDetails";
import StandardFee from "../../core/types/standardFee";
import StandardTransfer from "../../core/types/standardTransfer";
import { TransactionDataBody } from '../../core/types/transactionData';

export type PaymentDetailsTestCase<T extends PaymentDetails> = {
  attachmentDataBody: string;
  expectedTransactionDataBody: TransactionDataBody;
  expectedPaymentDetails: T;
};

export const paymentDetailsTestCases: Record<string, PaymentDetailsTestCase<PaymentDetails>> = {
  'UNKNOWN': {
      attachmentDataBody: `
          <td nowrap="" align="left">xxx<br></td>
          <td align="center">
          <table width="100%">
              <tbody><tr>
                  <td align="right" nowrap="">4591TATB0</td>
              </tr>
              <tr>
                  <td align="right" nowrap=""></td>
              </tr>
          </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.UNKNOWN,
          paymentDetailsRaw: [ 'xxx' ],
          additionalDetailsRaw: ['4591TATB0']
      },
      expectedPaymentDetails: Constants.defaultPaymentDetails
  },
  'CARD_OPERATION > ПОС': {
      attachmentDataBody: `
          <td nowrap="" align="left">Операция с карта<br><br>ПОС 4.48 BGN авт.код:833023-GLOBAL RETAIL HOLDING EOO/VARNA/PAN:4402****5296/CT:<wbr>01<br></td>
          <td align="center">
              <table width="100%">
                  <tbody><tr>
                      <td align="right" nowrap="">4591TATB0</td>
                  </tr>
                  <tr>
                      <td align="right" nowrap=""></td>
                  </tr>
              </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CARD_OPERATION,
          paymentDetailsRaw: ['ПОС 4.48 BGN авт.код:833023-GLOBAL RETAIL HOLDING EOO/VARNA/PAN:4402****5296/CT:01'],
          additionalDetailsRaw: ['4591TATB0'],
      },
      expectedPaymentDetails: {
          recipient: 'GLOBAL RETAIL HOLDING EOO',
          instrument: 'ПОС',
          sum: '4.48',
          currency: 'BGN'
      } as CardOperation
  },
  'CARD_OPERATION > Плащане /импринтер/ + multiline txn type at EOL': {
      attachmentDataBody: `
          <td nowrap="" align="left">та<br>Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08 /Операция с кар<br>Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08<br></td>
          <td align="center">
          <table width="100%">
              <tbody><tr>
                  <td align="right" nowrap="">4591TATB0</td>
              </tr>
              <tr>
                  <td align="right" nowrap=""></td>
              </tr>
          </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CARD_OPERATION,
          paymentDetailsRaw: [
              'Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08',
              'Плащане /импринтер/ 4.92 BGN авт.код:931226 - EATALYS / SOFIA/PAN:5169****6113/CT:08'
          ],
          additionalDetailsRaw: ['4591TATB0']
      },
      expectedPaymentDetails: {
          recipient: 'EATALYS',
          instrument: 'Плащане /импринтер/',
          sum: '4.92',
          currency: 'BGN'
      } as CardOperation
  },
  'CARD_OPERATION > Invalid body': {
      attachmentDataBody: `
          <td nowrap="" align="left">Операция с карта<br><br>xxx<br></td>
          <td align="center">
              <table width="100%">
                  <tbody><tr>
                      <td align="right" nowrap="">4591TATB0</td>
                  </tr>
                  <tr>
                      <td align="right" nowrap=""></td>
                  </tr>
              </tbody></table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CARD_OPERATION,
          paymentDetailsRaw: [],
          additionalDetailsRaw: ['4591TATB0'],
      },
      expectedPaymentDetails: Constants.defaultPaymentDetails
  },
  'CROSS_BORDER_TRANSFER': {
      attachmentDataBody: `
          <td nowrap="" align="left">, BUNQNL2AXXX , NL48BUNQ4950396806,   ,  ,/Издаване на превод във валута<br>AZV-Treehouse Distribution, Ord.Ref: NOTPROVIDED, HEDG, , T-535685  , GPP Ref.: 2243120123, , 1.9585<br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CROSS_BORDER_TRANSFER,
          paymentDetailsRaw: ['AZV-Treehouse Distribution, Ord.Ref: NOTPROVIDED, HEDG, , T-535685  , GPP Ref.: 2243120123, , 1.9585, BUNQNL2AXXX , NL48BUNQ4950396806,   ,  ,'],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'Treehouse Distribution',
          recipientIban: 'NL48BUNQ4950396806',
          description: 'Ord.Ref: NOTPROVIDED, HEDG, T-535685, GPP Ref.: 2243120123'
      } as CrossBorderTransfer
  },
  'CROSS_BORDER_TRANSFER > Invalid body': {
      attachmentDataBody: `
          <td nowrap="" align="left">, BUNQNL2AXXX , NL48BUNQ4950396806,   ,  ,/Издаване на превод във валута<br>AZV-Treehouse Distribution, xxx<br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CROSS_BORDER_TRANSFER,
          paymentDetailsRaw: [],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: Constants.defaultPaymentDetails
  },
  'CROSS_BORDER_TRANSFER_FEE': {
      attachmentDataBody: `
          <td nowrap="" align="left"><br>AZV-Commission  for GPP transaction Ref.: 2283100163/Такси издадени валутни преводи<br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.CROSS_BORDER_TRANSFER_FEE,
          paymentDetailsRaw: ['AZV-Commission  for GPP transaction Ref.: 2283100163'],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'Commission  for GPP transaction Ref.: 2283100163',
      } as CrossBorderTransferFee
  },
  'DESK_WITHDRAWAL': {
      attachmentDataBody: `
          <td nowrap="nowrap" align="left"><br />ТЕГЛ.НА КАСА /Теглене на пари на каса от клнт с-к<br />ТЕГЛ.НА КАСА ИВАН ИВАНОВ ИВАНОВ<br /></td>
          <td align="center">
            <table width="100%">
              <tr>
                <td align="right" nowrap="nowrap">501149563</td>
              </tr>
              <tr>
                <td align="right" nowrap="nowrap"></td>
              </tr>
            </table>
          </td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.DESK_WITHDRAWAL,
          paymentDetailsRaw: [
              'ТЕГЛ.НА КАСА',
              'ТЕГЛ.НА КАСА ИВАН ИВАНОВ ИВАНОВ'
          ],
          additionalDetailsRaw: ['501149563']
      },
      expectedPaymentDetails: {
          recipient: 'ИВАН ИВАНОВ ИВАНОВ',
          recipientIban: 'N/A',
          description: 'ТЕГЛ.НА КАСА'
      } as DeskWithdrawal
  },
  // Standard Fees
  'PERIODIC_FEE': {
      attachmentDataBody: `
          <td nowrap="" align="left">Периодична такса<br><br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.PERIODIC_FEE,
          paymentDetailsRaw: [],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'N/A',
      } as StandardFee
  },
  'INTERBANK_TRANSFER_FEE': {
      attachmentDataBody: `
          <td nowrap="" align="left">Такса за междубанков превод<br><br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INTERBANK_TRANSFER_FEE,
          paymentDetailsRaw: [],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'N/A',
      } as StandardFee
  },
  'TRANSFER_FEE': {
      attachmentDataBody: `
        <td nowrap="" align="left">Такса за превод<br><br><br></td>
        <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.TRANSFER_FEE,
          paymentDetailsRaw: [],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'N/A',
      } as StandardFee
  },
  'INTERNAL_TRANSFER_FEE': {
      attachmentDataBody: `
          <td nowrap="" align="left">Такса за вътрешнобанков превод<br><br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.INTERNAL_TRANSFER_FEE,
          paymentDetailsRaw: [],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'N/A',
      } as StandardFee
  },
  'WITHDRAWAL_FEE': {
      attachmentDataBody: `
          <td nowrap="" align="left"><br>ТЕГЛ.НА КАСА /Такса за теглене над определена сума<br><br></td>
          <td align="center"></td>`,
      expectedTransactionDataBody: {
          transactionType: TransactionType.WITHDRAWAL_FEE,
          paymentDetailsRaw: ['ТЕГЛ.НА КАСА'],
          additionalDetailsRaw: []
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'N/A',
          description: 'ТЕГЛ.НА КАСА',
      } as StandardFee
  },
  // Standard Transfers
  'INTEREST_PAYMENT': {
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
          paymentDetailsRaw: ['70001234567820 BGN .25'],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN .25',
      } as StandardTransfer
  },
  'INTEREST_TAX': {
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
          paymentDetailsRaw: ['70001234567820 BGN .02'],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN .02'
      } as StandardTransfer
  },
  'PRINCIPAL_REPAYMENT': {
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
          paymentDetailsRaw: ['70001234567820 BGN 1234.56'],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 1234.56'
      } as StandardTransfer
  },
  'INSURANCE_PREMIUM': {
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
          paymentDetailsRaw: ['70001234567820 BGN 1.23'],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 1.23'
      } as StandardTransfer
  },
  'INTEREST_REPAYMENT': {
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
          paymentDetailsRaw: ['70001234567820 BGN 4.56'],
          additionalDetailsRaw: [
              'NA',
              'UNICREDIT BULBANK'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'UNICREDIT BULBANK',
          recipientIban: 'NA',
          description: '70001234567820 BGN 4.56'
      } as StandardTransfer
  },
  'INTERNAL_TRANSFER > Вътрешно банков превод Payroll': {
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
          paymentDetailsRaw: ['Example description'],
          additionalDetailsRaw: [
              'BG69UNCR70001512345693',
              'Example account name'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'Example account name',
          recipientIban: 'BG69UNCR70001512345693',
          description: 'Example description',
      } as StandardTransfer
  },
  'INTERNAL_TRANSFER > Вътрешнобанков превод FC': {
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
          paymentDetailsRaw: ['savings transfer'],
          additionalDetailsRaw: [
              'BG52UNCR70001234567892',
              'ИВАН ИВАНОВ ИВАНОВ'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'ИВАН ИВАНОВ ИВАНОВ',
          recipientIban: 'BG52UNCR70001234567892',
          description: 'savings transfer'
      } as StandardTransfer
  },
  'INTERNAL_TRANSFER > Вътрешнобанков превод': {
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
      } as StandardTransfer
  },
  'INTERNAL_TRANSFER > Издаден вътр.банков превод': {
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
          paymentDetailsRaw: ['Задължения на Иван Иванов към дата: 1.12.2022 г.'],
          additionalDetailsRaw: [
              'BG81UNCR70001234567820',
              'Example account name'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'Example account name',
          recipientIban: 'BG81UNCR70001234567820',
          description: 'Задължения на Иван Иванов към дата: 1.12.2022 г.'
      } as StandardTransfer
  },
  'INTERBANK_TRANSFER': {
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
          paymentDetailsRaw: ['Example description'],
          additionalDetailsRaw: [
              'BG87ESPY40041234567810',
              'Example account name'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'Example account name',
          recipientIban: 'BG87ESPY40041234567810',
          description: 'Example description'
      } as StandardTransfer
  },
  'UTILITY_PAYMENT > Комунално плащане mBanking': {
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
          paymentDetailsRaw: ['ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.2020'],
          additionalDetailsRaw: [
              'BG81UNCR763044444CEZEL',
              'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД',
          recipientIban: 'BG81UNCR763044444CEZEL',
          description: 'ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.2020'
      } as StandardTransfer
  },
  'UTILITY_PAYMENT > Комунално плащане': {
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
          paymentDetailsRaw: ['Софийска Вода АД аб.номер 1001234588,2000123493'],
          additionalDetailsRaw: [
              'BG29UNCR76301005587757',
              'УНИКРЕДИТ БУЛБАНК СВЕТА НЕДЕЛЯ'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'УНИКРЕДИТ БУЛБАНК СВЕТА НЕДЕЛЯ',
          recipientIban: 'BG29UNCR76301005587757',
          description: 'Софийска Вода АД аб.номер 1001234588,2000123493',
      } as StandardTransfer
  },
  'UTILITY_PAYMENT > Комунално плащане BBO': {
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
      } as StandardTransfer
  },
  'RECEIVED_INTERBANK_TRANSFER': {
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
          paymentDetailsRaw: ['BGCOD RETURN 213123442 .'],
          additionalDetailsRaw: [
              'BG95INGB91451000000815',
              'ABOUT YOU SE . CO. KG'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'ABOUT YOU SE . CO. KG',
          recipientIban: 'BG95INGB91451000000815',
          description: 'BGCOD RETURN 213123442 .'
      } as StandardTransfer
  },
  'RECEIVED_INTERNAL_PAYMENT': {
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
          paymentDetailsRaw: ['Example description'],
          additionalDetailsRaw: [
              'BG69UNCR70001512345693',
              'Example account name'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'Example account name',
          recipientIban: 'BG69UNCR70001512345693',
          description: 'Example description',
      } as StandardTransfer
  },
  'PERIODIC_PAYMENT': {
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
          paymentDetailsRaw: ['Винетен стикер - СА1234KK'],
          additionalDetailsRaw: [
              'BG60SOMB91301024910104',
              'ИВАН ИВАНОВ ИВАНОВ'
          ]
      },
      expectedPaymentDetails: {
          recipient: 'ИВАН ИВАНОВ ИВАНОВ',
          recipientIban: 'BG60SOMB91301024910104',
          description: 'Винетен стикер - СА1234KK',
      } as StandardTransfer
  },
};