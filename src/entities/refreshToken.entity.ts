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
    client_token!: string;
    
    @Unique
    @AllowNull(false)
    @PrimaryKey
    @Column
    refresh_token!: string;
}