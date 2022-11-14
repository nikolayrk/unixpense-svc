import { AllowNull, Column, DataType, Table } from "sequelize-typescript";
import PaymentDetailsEntity from "./paymentDetails.base";

@Table({
    tableName: "card_operations",
    timestamps: false
})
export default class CardOperationEntity extends PaymentDetailsEntity {
    @AllowNull(false)
    @Column
    instrument!: string;

    @AllowNull(false)
    @Column(DataType.DECIMAL(20, 2))
    sum!: string;

    @AllowNull(false)
    @Column
    currency!: string;
}