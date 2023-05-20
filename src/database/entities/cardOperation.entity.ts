import { Table, AllowNull, Column, DataType } from "sequelize-typescript";
import PaymentDetailsEntityBase from "./paymentDetails.entity.base";


@Table({
    modelName: "card_operation",
    timestamps: false,
    indexes: [{
        fields: ['transaction_id']
    }]
})
export default class CardOperationEntity extends PaymentDetailsEntityBase {
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