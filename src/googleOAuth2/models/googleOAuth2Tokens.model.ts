import { AllowNull, Column, DataType, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

@Table({
    modelName: "google_oauth2_tokens",
    timestamps: true,
    indexes: [{
        fields: ['user_email']
    }]
})
export default class GoogleOAuth2Tokens extends Model {
    @PrimaryKey
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    user_email!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    access_token!: string;
    
    @AllowNull(false)
    @Column(DataType.STRING)
    refresh_token!: string;
}