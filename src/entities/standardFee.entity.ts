import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsEntityBase from "./paymentDetails.entity.base";

@Table({
    modelName: "standard_fee",
    timestamps: false,
    indexes: [{
        fields: ['transaction_reference']
    }]
})
export default class StandardFeeEntity extends PaymentDetailsEntityBase {
    @AllowNull(false)
    @Column
    description!: string;
}