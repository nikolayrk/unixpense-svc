import EntryType from '../enums/entryType';
import TransactionType from '../enums/transactionType';

export class EntryTypeUtil {
    public static ToString(entryType: EntryType) {
        return Object.keys(EntryType)[Object.values(EntryType).indexOf(entryType)];
    }
}
export class TransactionTypeUtil {
    public static ToString(transactionType: TransactionType) {
        return Object.keys(TransactionType)[Object.values(TransactionType).indexOf(transactionType)];
    }
}
