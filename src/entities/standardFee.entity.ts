import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntity from "./paymentDetails.base";

@Table({
    tableName: "standard_fees",
    timestamps: false
})
export default class StandardFeeEntity extends PaymentDetailsEntity {
    @AllowNull(false)
    @Column
    description!: string;
}