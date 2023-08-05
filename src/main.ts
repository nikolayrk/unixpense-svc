import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import { createDatabaseConnectionAsync, registerDependencies, startServerAsync } from './bootstrap';

const main = async () => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

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
        throw new Error('Failed to create a connection to the database');
    }

    logger.log('Registering dependencies...');

    registerDependencies();

    logger.log('Starting server...');

    const port = Number.isNaN(process.env.PORT ?? NaN)
        ? 8000
        : Number(process.env.PORT);

    const server = await startServerAsync(port);

    logger.log(`Server is running`);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    const closeResources = () => {
        server.close(async (err) => {
            let exitCode = 0;

            if(err) {
                logger.error(err);

                exitCode = 1;
            }
        
            await logger.beforeExit();

            await connection.close();

            process.exit(exitCode);
        });
    }

    const signalHandlerAsync = async (signal: string) => {
        logger.log(`${signal} received. Exiting...`, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            signal: signal
        });

        closeResources();
    };
    
    const gracefulShutdownAsync = async (err: Error) => {
        logger.error(err, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
        });

        closeResources();
    };
    
    const beforeExitAsync = async (exitCode: number) => {
        logger.log(`Service exited`, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            exitCode: exitCode
        });

        closeResources();
    };
    
    process.on('SIGINT', signalHandlerAsync);
    process.on('SIGTERM', signalHandlerAsync);
    process.on('uncaughtExceptionMonitor', gracefulShutdownAsync);
    process.on('beforeExit', beforeExitAsync);
}

main();