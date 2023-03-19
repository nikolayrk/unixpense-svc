import TransactionType from '../enums/transactionType';
import { TransactionTypeStringUnion } from './transactionTypeString';

const transactionTypeByString: {
    [key in TransactionTypeStringUnion]: TransactionType;
} = {
    ['Операция с карта']:                       TransactionType.CARD_OPERATION,
    ['Издаване на превод във валута']:          TransactionType.CROSS_BORDER_TRANSFER,
    ['Периодична такса']:                       TransactionType.PERIODIC_FEE,
    ['Такса за междубанков превод']:            TransactionType.INTERBANK_TRANSFER_FEE,
    ['Такса за превод']:                        TransactionType.TRANSFER_FEE,
    ['Такси издадени валутни преводи']:         TransactionType.CROSS_BORDER_TRANSFER_FEE,
    ['Такса за вътрешнобанков превод']:         TransactionType.INTERNAL_TRANSFER_FEE,
    ['Такса за теглене над определена сума']:   TransactionType.WITHDRAWAL_FEE,
    ['Теглене на пари на каса от клнт с-к']:    TransactionType.DESK_WITHDRAWAL_FEE,
    ['Вътрешно банков превод Payroll']:         TransactionType.INTERNAL_TRANSFER,
    ['Плащане на лихва']:                       TransactionType.INTEREST_PAYMENT,
    ['Удържане на данък в/у лихва']:            TransactionType.INTEREST_TAX,
    ['Вътрешнобанков превод FC']:               TransactionType.INTERNAL_TRANSFER,
    ['Вътрешнобанков превод']:                  TransactionType.INTERNAL_TRANSFER,
    ['Платежно нареждане извън банката']:       TransactionType.INTERBANK_TRANSFER,
    ['Комунално плащане mBanking']:             TransactionType.UTILITY_PAYMENT,
    ['Комунално плaщане']:                      TransactionType.UTILITY_PAYMENT,
    ['Получен междубанков превод']:             TransactionType.RECEIVED_INTERBANK_TRANSFER,
    ['Комунално плащане BBO']:                  TransactionType.UTILITY_PAYMENT,
    ['Получен вътр.банков превод']:             TransactionType.RECEIVED_INTERNAL_PAYMENT,
    ['Периодично плащане']:                     TransactionType.PERIODIC_PAYMENT,
    ['Погасяване на главница']:                 TransactionType.PRINCIPAL_REPAYMENT,
    ['Застрахователна премия']:                 TransactionType.INSURANCE_PREMIUM,
    ['Погасяв.на л-ва за редовна главница']:    TransactionType.INTEREST_REPAYMENT,
    ['Издаден вътр.банков превод']:             TransactionType.INTERNAL_TRANSFER,
};

export default transactionTypeByString;