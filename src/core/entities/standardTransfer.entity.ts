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
    @AllowNull(false)
    @Column
    recipient_iban!: string;

    @AllowNull(false)
    @Column
    description!: string;
}