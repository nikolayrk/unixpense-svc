import { AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Unique } from "sequelize-typescript";
import TransactionEntity from "./transaction.entity";

export default abstract class PaymentDetailsEntity extends Model {
    @Unique
    @AllowNull(false)
    @ForeignKey(() => TransactionEntity)
    @PrimaryKey
    @Column
    message_id!: string;

    @BelongsTo(() => TransactionEntity)
    transaction!: TransactionEntity;

    @AllowNull(false)
    @Column
    beneficiary!: string;
}