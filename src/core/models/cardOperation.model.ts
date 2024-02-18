import { Table, AllowNull, Column, DataType } from "sequelize-typescript";
import PaymentDetailsBase from "./paymentDetails.model.base";


@Table({
    modelName: "card_operation",
    timestamps: false,
    indexes: [{
        fields: ['transaction_id']
    }, {
        fields: ['recipient'],
        type: 'FULLTEXT'
    }, {
        fields: ['instrument'],
        type: 'FULLTEXT'
    }]
})
export default class CardOperation extends PaymentDetailsBase {
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