import { Table, Column, Model, PrimaryKey, DataType, Unique, AllowNull, IsDate, HasOne } from 'sequelize-typescript';
import { EntryTypeExtensions } from '../../core/extensions/entryTypeExtensions';
import { TransactionTypeExtensions } from '../../core/extensions/transactionTypeExtensions';
import PaymentDetails from '../../core/models/paymentDetails';
import CardOperationEntity from './cardOperation.entity';
import StandardTransferEntity from './standardTransfer.entity';

@Table({
    modelName: "transaction",
    timestamps: false,
    indexes: [{
        fields: ['id']
    }]
})
export default class TransactionEntity extends Model {
    @HasOne(() => CardOperationEntity, {
        as: 'card_operation',
        foreignKey: 'transaction_id'
    })
    card_operation!: PaymentDetails;
    
    @HasOne(() => StandardTransferEntity, {
        as: 'standard_transfer',
        foreignKey: 'transaction_id',
    })
    standard_transfer!: PaymentDetails;

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