import { AllowNull, BelongsTo, Column, ForeignKey, Model } from "sequelize-typescript";
import TransactionEntity from "./transaction.entity";

export default abstract class PaymentDetailsEntity extends Model {
    @ForeignKey(() => TransactionEntity)
    @Column
    message_id!: string;

    @BelongsTo(() => TransactionEntity)
    transaction!: TransactionEntity;

    @AllowNull(false)
    @Column
    beneficiary!: string;
}