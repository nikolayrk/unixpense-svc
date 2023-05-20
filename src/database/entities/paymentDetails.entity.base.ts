import { AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Unique } from "sequelize-typescript";
import TransactionEntity from "./transaction.entity";

export default abstract class PaymentDetailsEntityBase extends Model {
    @BelongsTo(() => TransactionEntity, { foreignKey: 'transaction_id' })
    transaction!: TransactionEntity;

    @PrimaryKey
    @ForeignKey(() => TransactionEntity)
    @Unique
    @AllowNull(false)
    @Column
    transaction_id!: string;

    @AllowNull(false)
    @Column
    recipient!: string;
}