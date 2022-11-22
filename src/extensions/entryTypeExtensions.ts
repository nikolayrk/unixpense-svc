import EntryType from '../enums/entryType';


export class EntryTypeExtensions {
    public static ToString(entryType: EntryType) {
        return Object.keys(EntryType)[Object.values(EntryType).indexOf(entryType)];
    }
}
