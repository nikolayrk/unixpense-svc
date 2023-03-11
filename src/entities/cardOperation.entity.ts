import { AllowNull, Column, DataType, Table } from "sequelize-typescript";
import PaymentDetailsEntity from "./paymentDetails.base";

@Table({
    tableName: "card_operations",
    timestamps: false
})
export default class CardOperationEntity extends PaymentDetailsEntity {
    @AllowNull(true)
    @Column
    instrument!: string;

    @AllowNull(true)
    @Column(DataType.DECIMAL(20, 2))
    sum!: string;

    @AllowNull(true)
    @Column
    currency!: string;
}