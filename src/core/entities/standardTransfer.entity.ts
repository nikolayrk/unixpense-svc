import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntityBase from "./paymentDetails.entity.base";

@Table({
    modelName: "standard_transfer",
    timestamps: false,
    indexes: [{
        fields: ['transaction_id']
    }]
})
export default class StandardTransferEntity extends PaymentDetailsEntityBase {
    @AllowNull(true)
    @Column
    recipient_iban!: string;

    @AllowNull(true)
    @Column
    description!: string;
}