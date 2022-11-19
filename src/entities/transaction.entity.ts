import { Table, Column, Model, PrimaryKey, DataType, Unique, AllowNull, IsDate, HasOne } from 'sequelize-typescript';
import EntryType from '../enums/entryType';
import TransactionType from '../enums/transactionType';
import CardOperation from '../models/cardOperation';
import CardOperationEntity from './cardOperation.entity';
import CrossBorderTransfer from '../models/crossBorderTransfer';
import CrossBorderTransferEntity from './crossBorderTransfer.entity';
import StandardFee from '../models/standardFee';
import StandardFeeEntity from './standardFee.entity';
import StandardTransfer from '../models/standardTransfer';
import StandardTransferEntity from './standardTransfer.entity';

@Table({
    tableName: "transactions",
    timestamps: false
})
export default class TransactionEntity extends Model {
    @Unique
    @AllowNull(false)
    @PrimaryKey
    @Column
    message_id!: string;

    @AllowNull(false)
    @IsDate
    @Column
    date!: Date;

    @AllowNull(false)
    @Column
    reference!: string;

    @AllowNull(false)
    @IsDate
    @Column
    value_date!: Date;

    @AllowNull(false)
    @Column(DataType.DECIMAL(20, 2))
    sum!: number;

    @AllowNull(false)
    @Column(DataType.ENUM(...Object.keys(EntryType)))
    entry_type!: string;

    @AllowNull(false)
    @Column(DataType.ENUM(...Object.keys(TransactionType)))
    type!: string;

    @HasOne(() => CardOperationEntity)
    card_operation!: CardOperation;

    @HasOne(() => CrossBorderTransferEntity)
    cross_border_transfer!: CrossBorderTransfer;

    @HasOne(() => StandardFeeEntity)
    standard_fee!: StandardFee;

    @HasOne(() => StandardTransferEntity)
    standard_transfer!: StandardTransfer;
}