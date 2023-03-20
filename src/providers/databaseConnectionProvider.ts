import { Sequelize } from "sequelize-typescript";
import mariadb from 'mariadb';

export default class DatabaseConnectionProvider {
    private readonly host: string;
    private readonly port: number;
    private readonly username: string;
    private readonly password: string;
    private readonly database: string;

    constructor(host: string, port: number, username: string, password: string, database: string) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.database = database;
    }

    public async tryGetAsync() {
        await this.createDatabaseIfNotExistsAsync();

        const connection = new Sequelize({
            dialect: "mariadb",
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
            database: this.database,
            logging: false,
            models: [__dirname + '/../entities/*.entity.{js,ts}'],
        });

        await connection.authenticate(); // Throws on failure

        await connection.sync();

        return connection;
    }

    private async createDatabaseIfNotExistsAsync() {
        const pool = mariadb.createPool({
            host: this.host,
            port: this.port,
            user: this.username,
            password: this.password,
            connectionLimit: 5
        });

        const conn = await pool.getConnection();

        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${this.database}\`;`);

        await conn.release();
    }
}