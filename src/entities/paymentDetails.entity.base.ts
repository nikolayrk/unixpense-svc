import { AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Unique } from "sequelize-typescript";
import TransactionEntity from "./transaction.entity";

export default abstract class PaymentDetailsEntityBase extends Model {
    @BelongsTo(() => TransactionEntity, {
        as: 'card_operation',
        foreignKey: 'transaction_reference'
    })
    transaction!: TransactionEntity;

    @PrimaryKey
    @ForeignKey(() => TransactionEntity)
    @Unique
    @AllowNull(false)
    @Column
    transaction_reference!: string;

    @AllowNull(false)
    @Column
    recipient!: string;
}