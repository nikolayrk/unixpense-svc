import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntityBase from "./paymentDetails.entity.base";

@Table({
    modelName: "desk_withdrawal",
    timestamps: false,
    indexes: [{
        fields: ['transaction_reference']
    }]
})
export default class DeskWithdrawalEntity extends PaymentDetailsEntityBase {
    @AllowNull(false)
    @Column
    description!: string;

    @AllowNull(false)
    @Column
    additionalDetails!: string;
}