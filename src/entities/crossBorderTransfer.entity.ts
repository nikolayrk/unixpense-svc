import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntity from "./paymentDetails.base";

@Table({
    tableName: "cross_border_transfers",
    timestamps: false
})
export default class CrossBorderTransferEntity extends PaymentDetailsEntity {
    @AllowNull(false)
    @Column
    iban!: string;

    @AllowNull(false)
    @Column
    description!: string;
}