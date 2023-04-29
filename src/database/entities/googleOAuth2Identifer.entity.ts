import { AllowNull, Column, DataType, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

@Table({
    modelName: "googleOAuth2Identifier",
    timestamps: true,
    indexes: [{
        fields: ['client_id']
    }, {
        fields: ['access_token']
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
    
    @Unique
    @AllowNull(false)
    @Column(DataType.STRING)
    redirect_uri!: string;
    
    @Unique
    @AllowNull(true)
    @Column(DataType.STRING)
    access_token!: string;
    
    @Unique
    @AllowNull(true)
    @Column(DataType.STRING)
    refresh_token!: string;
}