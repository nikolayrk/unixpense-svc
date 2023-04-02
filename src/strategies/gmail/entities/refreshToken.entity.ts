import { AllowNull, Column, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

@Table({
    modelName: "refresh_token",
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
    @Column
    refresh_token!: string;
}