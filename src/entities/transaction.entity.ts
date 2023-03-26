import { Table, Column, Model, PrimaryKey, DataType, Unique, AllowNull, IsDate, HasOne } from 'sequelize-typescript';
import { EntryTypeExtensions } from '../extensions/entryTypeExtensions';
import { TransactionTypeExtensions } from '../extensions/transactionTypeExtensions';
import PaymentDetails from '../models/paymentDetails';
import CardOperationEntity from './cardOperation.entity';
import CrossBorderTransferEntity from './crossBorderTransfer.entity';
import StandardFeeEntity from './standardFee.entity';
import StandardTransferEntity from './standardTransfer.entity';

@Table({
    modelName: "transaction",
    timestamps: false,
    indexes: [{
        fields: ['message_id']
    }, {
        fields: ['reference', 'type'],
        unique: true
    }]
})
export default class TransactionEntity extends Model {
    @HasOne(() => CardOperationEntity, {
        as: 'card_operation',
        foreignKey: 'transaction_reference'
    })
    card_operation!: PaymentDetails;
    
    @HasOne(() => CrossBorderTransferEntity, {
        as: 'cross_border_transfer',
        foreignKey: 'transaction_reference'
    })
    cross_border_transfer!: PaymentDetails;
    
    @HasOne(() => StandardFeeEntity, {
        as: 'standard_fee',
        foreignKey: 'transaction_reference'
    })
    standard_fee!: PaymentDetails;
    
    @HasOne(() => StandardTransferEntity, {
        as: 'standard_transfer',
        foreignKey: 'transaction_reference'
    })
    standard_transfer!: PaymentDetails;

    @Unique
    @AllowNull(false)
    @Column
    message_id!: string;

    @IsDate
    @AllowNull(false)
    @Column
    date!: Date;

    @PrimaryKey
    @AllowNull(false)
    @Column
    reference!: string;

    @IsDate
    @AllowNull(false)
    @Column
    value_date!: Date;

    @AllowNull(false)
    @Column(DataType.DECIMAL(20, 2))
    sum!: number;

    @AllowNull(false)
    @Column(EntryTypeExtensions.ToDataType())
    entry_type!: string;

    @PrimaryKey
    @AllowNull(false)
    @Column(TransactionTypeExtensions.ToDataType())
    type!: string;

    @AllowNull(true)
    @Column
    alias!: string;

    @AllowNull(true)
    @Column
    category!: string;
}