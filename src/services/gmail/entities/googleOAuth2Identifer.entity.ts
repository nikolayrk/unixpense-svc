import { AllowNull, Column, DataType, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

@Table({
    modelName: "google_oauth2_identifier",
    timestamps: true,
    indexes: [{
        fields: ['client_id']
    }]
})
export default class GoogleOAuth2IdentifierEntity extends Model {
    @PrimaryKey
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    client_id!: string;
    
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    client_secret!: string;
    
    @AllowNull(false)
    @Column(DataType.STRING)
    redirect_uri!: string;
    
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    access_token!: string;
    
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    refresh_token!: string;
}