import mariadb from 'mariadb';
import { Sequelize } from 'sequelize-typescript';

export default async function createDatabaseConnection(host: string, port: number, username: string, password: string, database: string) {
    await createDatabaseIfNotExists(host, port, username, password, database);

    const connection = new Sequelize({
        dialect: "mariadb",
        host: host,
        port: port,
        username: username,
        password: password,
        database: database,
        logging: false,
        models: [__dirname + '/../entities/*.entity.ts'],
        });
        
    await connection.sync();

    return connection;
}

async function createDatabaseIfNotExists(host: string, port: number, username: string, password: string, database: string) {
    const pool = mariadb.createPool({
        host: host,
        port: port,
        user: username,
        password: password,
        connectionLimit: 5
    });

    const conn = await pool.getConnection();

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    conn.release();
}