import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import { createDatabaseConnectionAsync, registerDependencies, registerErrorHandlers, server } from './bootstrap';

const main = async () => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log('Registering error handlers...');

    registerErrorHandlers(logger);

    logger.log('Creating database connection...');

    const host = process.env.MARIADB_HOST ?? process.env.HOSTNAME ?? 'localhost';
    const port = process.env.MARIADB_PORT !== undefined
        ? Number(process.env.MARIADB_PORT)
        : 3306;
    const username = process.env.MARIADB_USER ?? '';
    const password = process.env.MARIADB_PASSWORD ?? '';
    const database = process.env.MARIADB_DATABASE ?? 'unixpense';

    const connection = await createDatabaseConnectionAsync(host, port, username, password, database, logger);

    if (connection === null) {
        return;
    }

    logger.log('Registering dependencies...');

    registerDependencies();

    logger.log('Starting server...');

    const app = server(logger);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });
}

main();