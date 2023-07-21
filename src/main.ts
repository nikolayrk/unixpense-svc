import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import { createDatabaseConnectionAsync, registerDependencies, registerErrorHandlers, startServerAsync } from './bootstrap';

const main = async () => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log('Registering error handlers...');

    registerErrorHandlers(logger);

    logger.log('Creating database connection...');

    const mariadbHost = process.env.MARIADB_HOST ?? process.env.HOSTNAME ?? 'localhost';
    const mariadbPort = process.env.MARIADB_PORT !== undefined
        ? Number(process.env.MARIADB_PORT)
        : 3306;
    const username = process.env.MARIADB_USER;
    const password = process.env.MARIADB_PASSWORD;
    const database = process.env.MARIADB_DATABASE ?? 'unixpense';

    if (username === undefined || password === undefined) {
        throw new Error('Missing database credentials');
    }

    const connection = await createDatabaseConnectionAsync(mariadbHost, mariadbPort, username, password, database, logger);

    if (connection === null) {
        return;
    }

    logger.log('Registering dependencies...');

    registerDependencies();

    logger.log('Starting server...');

    const hostname = process.env.HOSTNAME ?? 'localhost';
    const port = Number.isNaN(process.env.PORT ?? NaN)
        ? 8000
        : Number(process.env.PORT);

    await startServerAsync(port);

    logger.log(`Server is running`, { hostname, port });

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });
}

main();