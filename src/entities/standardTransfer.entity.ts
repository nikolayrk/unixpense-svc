import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntity from "./paymentDetails.base";

@Table({
    tableName: "standard_transfers",
    timestamps: false
})
export default class StandardTransferEntity extends PaymentDetailsEntity {
    @AllowNull(false)
    @Column
    iban!: string;

    @AllowNull(false)
    @Column
    description!: string;
}