
import { Sequelize } from 'sequelize-typescript';
import * as mariadb from 'mariadb';
import Constants from './constants';

const createDatabaseIfNotExistsAsync = async (host: string, port: number, username: string, password: string, database: string) => {
    const conn = await mariadb.createConnection({
        host: host,
        port: port,
        user: username,
        password: password
    });

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    await conn.end();
}

const createDatabaseConnectionAsync = async () => {
    const host = process.env.MARIADB_HOST ?? Constants.Defaults.mariadbHost;
    const port = process.env.MARIADB_PORT !== undefined
        ? Number(process.env.MARIADB_PORT)
        : Constants.Defaults.mariadbPort;
    const username = process.env.MARIADB_USER ?? Constants.Defaults.mariadbUser;
    const password = process.env.MARIADB_PASSWORD ?? Constants.Defaults.mariadbPassword;
    const database = process.env.MARIADB_DATABASE ?? Constants.Defaults.mariadbDatabase;

    await createDatabaseIfNotExistsAsync(host, port, username, password, database); // TODO: include in initial migration script

    const connection = new Sequelize({
        dialect: "mariadb",
        host: host,
        port: port,
        username: username,
        password: password,
        database: database,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            multipleStatements: true,
        },
    });
    
    await connection.authenticate();
    
    return connection;
}

const defineDatabaseModels = async (connection: Sequelize, force?: boolean) => {
    connection.addModels([__dirname + '/../src/**/models/*.model.{js,ts}']);

    await connection.sync({ force });
}

export {
    createDatabaseConnectionAsync,
    defineDatabaseModels
}
