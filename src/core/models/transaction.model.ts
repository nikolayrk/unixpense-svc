import { Table, Column, Model, PrimaryKey, DataType, Unique, AllowNull, IsDate, HasOne } from 'sequelize-typescript';
import { EntryTypeExtensions } from '../extensions/entryTypeExtensions';
import { TransactionTypeExtensions } from '../extensions/transactionTypeExtensions';
import CardOperation from './cardOperation.model';
import StandardTransfer from './standardTransfer.model';

@Table({
    modelName: "transaction",
    timestamps: false,
    indexes: [{
        fields: ['id']
    }]
})
export default class Transaction extends Model {
    @HasOne(() => CardOperation, {
        as: 'card_operation',
        foreignKey: 'transaction_id'
    })
    card_operation!: CardOperation;
    
    @HasOne(() => StandardTransfer, {
        as: 'standard_transfer',
        foreignKey: 'transaction_id',
    })
    standard_transfer!: StandardTransfer;

    @PrimaryKey
    @Unique
    @AllowNull(false)
    @Column
    id!: string;

    @IsDate
    @AllowNull(false)
    @Column
    date!: string;

    @Unique('unique-transaction')
    @AllowNull(false)
    @Column
    reference!: string;

    @IsDate
    @AllowNull(false)
    @Column
    value_date!: string;

    @AllowNull(false)
    @Column(DataType.DECIMAL(20, 2))
    sum!: string;

    @AllowNull(false)
    @Column(EntryTypeExtensions.toDataType())
    entry_type!: string;

    @Unique('unique-transaction')
    @AllowNull(false)
    @Column(TransactionTypeExtensions.toDataType())
    type!: string;
}