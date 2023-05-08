import { AllowNull, Column, DataType, Model, Table, Unique } from "sequelize-typescript";

@Table({
    modelName: "google_oauth2_identifier",
    timestamps: true,
    indexes: [{
        fields: ['user_email']
    }]
})
export default class GoogleOAuth2IdentifierEntity extends Model {
    @AllowNull(false)
    @Column(DataType.STRING)
    client_id!: string;
    
    @AllowNull(false)
    @Column(DataType.STRING)
    client_secret!: string;

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