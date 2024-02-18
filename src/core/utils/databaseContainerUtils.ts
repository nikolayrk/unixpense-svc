// @ts-ignore
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import Constants from '../../constants';
import { createDatabaseConnectionAsync } from '../../bootstrap';
import { Sequelize } from 'sequelize-typescript';
import * as mariadb from 'mariadb';

const createMariaDbContainerAsync = async () => {
    const container = await new GenericContainer("mariadb")
        .withEnvironment({ "MARIADB_ROOT_PASSWORD": Constants.Defaults.mariadbPassword })
        .withExposedPorts(Constants.Defaults.mariadbPort)
        .withWaitStrategy(Wait.forLogMessage("mariadbd: ready for connections.", 1))
        .start();

    return container;
}

const createContainerDatabaseConnectionAsync = async (container: StartedTestContainer) => {
    const mariadbHost = container.getHost();
    const mariadbMappedPort = container.getMappedPort(Constants.Defaults.mariadbPort);
    
    const connection = await createDatabaseConnectionAsync(
        mariadbHost,
        mariadbMappedPort,
        Constants.Defaults.mariadbUser,
        Constants.Defaults.mariadbPassword,
        Constants.Defaults.mariadbDatabase);

    return connection;
}

const clearDatabaseAsync = async (connection: Sequelize) => {
    const pool = mariadb.createPool({
        host: connection.options.host,
        port: connection.options.port,
        user: Constants.Defaults.mariadbUser,
        password: Constants.Defaults.mariadbPassword,
        database: Constants.Defaults.mariadbDatabase,
        multipleStatements: true
    });

    const conn = await pool.getConnection();

    await conn.query([
            'card_operations',
            'standard_transfers',
            'transactions'
       ].map(table => `DELETE FROM ${table};`)
        .join(''));

    await conn.release();

    await pool.end();
}

export {
    createMariaDbContainerAsync,
    createContainerDatabaseConnectionAsync,
    clearDatabaseAsync
}