import { AllowNull, Column, Table } from "sequelize-typescript";
import PaymentDetailsBase from "./paymentDetails.model.base";

@Table({
    modelName: "standard_transfer",
    timestamps: false,
    indexes: [{
        fields: ['transaction_id']
    }, {
        fields: ['recipient'],
        type: 'FULLTEXT'
    }, {
        fields: ['description'],
        type: 'FULLTEXT'
    }]
})
export default class StandardTransfer extends PaymentDetailsBase {
    @AllowNull(true)
    @Column
    recipient_iban!: string;

    @AllowNull(true)
    @Column
    description!: string;
}