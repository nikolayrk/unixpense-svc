import { AllowNull, Column, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

@Table({
    tableName: "refresh_tokens",
    timestamps: true
})
export default class RefreshTokenEntity extends Model {
    @Unique
    @AllowNull(false)
    @PrimaryKey
    @Column
    token!: string;
}