import { DataType } from 'sequelize-typescript';
import EntryType from '../enums/entryType';


export class EntryTypeExtensions {
    public static keys() {
        return Object.keys(EntryType).filter(k => isNaN(Number(k)));
    }

    public static toString(value: EntryType) {
        const ordinal = Number(EntryTypeExtensions.toOrdinalEnum(String(value)));
        const numberValue = Number(value);
        const index = Number.isNaN(numberValue)
            ? ordinal
            : numberValue;
            
        return this.keys()[index];
    }

    public static toDataType() {
        return DataType.ENUM(...this.keys());
    }

    public static toEnum(value: string) {
        return <EntryType> <unknown> value;
    }

    public static toOrdinalEnum(value: string) {
        return Object.entries(EntryType).find(e => e[0] === value)?.[1] as EntryType;
    }
}
