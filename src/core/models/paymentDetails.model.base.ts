import { AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Unique } from "sequelize-typescript";
import Transaction from "./transaction.model";

export default abstract class PaymentDetailsBase extends Model {
    @BelongsTo(() => Transaction, { foreignKey: 'transaction_id' })
    transaction!: Transaction;

    @PrimaryKey
    @ForeignKey(() => Transaction)
    @Unique
    @AllowNull(false)
    @Column
    transaction_id!: string;

    @AllowNull(false)
    @Column
    recipient!: string;
}