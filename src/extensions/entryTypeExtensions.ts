import { DataType } from 'sequelize-typescript';
import EntryType from '../enums/entryType';


export class EntryTypeExtensions {
    public static ToString(entryType: EntryType) {
        return Object.keys(EntryType)[Object.values(EntryType).indexOf(entryType)];
    }

    public static ToDataType() {
        return DataType.ENUM(...Object.keys(EntryType).filter(k => isNaN(Number(k))));
    }
}
