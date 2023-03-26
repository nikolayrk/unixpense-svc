import { Sequelize } from "sequelize-typescript";
import mariadb from 'mariadb';
import RefreshTokenEntity from "./entities/refreshToken.entity";
import CardOperationEntity from "./entities/cardOperation.entity";

export default class DatabaseConnection {
    private static singleton?: DatabaseConnection;
    private connection?: Sequelize;

    private constructor() { }

    public static get Singleton() {
        if (this.singleton === undefined) {
            this.singleton = new DatabaseConnection();
        }

        return this.singleton;
    }

    public async tryConnectAsync() {
        if (this.connection !== undefined) {
            return this.connection;
        }

        const host = process.env.UNIXPENSE_MARIADB_HOST;
        const port = process.env.UNIXPENSE_MARIADB_PORT;
        const username = process.env.UNIXPENSE_MARIADB_USERNAME;
        const password = process.env.UNIXPENSE_MARIADB_PASSWORD;
        const database = process.env.UNIXPENSE_MARIADB_DATABASE;

        if (host === undefined || 
            port === undefined || 
            username === undefined || 
            password === undefined || 
            database === undefined) {
            throw new Error(`Missing Database connection details`);
        }

        await this.createDatabaseIfNotExistsAsync(host, Number(port), username, password, database);

        const connection = new Sequelize({
            dialect: "mariadb",
            host: host,
            port: Number(port),
            username: username,
            password: password,
            database: database,
            logging: false,
            models: [__dirname + '/entities/*.entity.{js,ts}'],
        });

        await connection.authenticate(); // Throws on failure

        await connection.sync();

        return connection;
    }

    public async closeAsync() {
        if (this.connection === undefined) {
            return;
        }

        await this.connection.close();
    }

    private async createDatabaseIfNotExistsAsync(host: string, port: number, username: string, password: string, database: string) {
        const pool = mariadb.createPool({
            host: host,
            port: port,
            user: username,
            password: password,
            connectionLimit: 5
        });

        const conn = await pool.getConnection();

        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

        await conn.release();
    }
}