import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import {
    createDatabaseConnectionAsync,
    defineDatabaseModels,
    registerDependencies,
    startServerAsync,
    stopServerAsync
} from './bootstrap';
import Constants from './constants';
import { Sequelize } from 'sequelize-typescript';

const main = async () => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log('Creating database connection...');

    const mariadbHost = process.env.MARIADB_HOST ?? process.env.HOSTNAME ?? 'localhost';
    const mariadbPort = process.env.MARIADB_PORT !== undefined
        ? Number(process.env.MARIADB_PORT)
        : Constants.Defaults.mariadbPort;
    const username = process.env.MARIADB_USER;
    const password = process.env.MARIADB_PASSWORD;
    const database = process.env.MARIADB_DATABASE ?? Constants.Defaults.mariadbDatabase;

    if (username === undefined || password === undefined) {
        throw new Error('Missing database credentials');
    }

    let connection: Sequelize | null = null;

    try {
        connection = await createDatabaseConnectionAsync(mariadbHost, mariadbPort, username, password, database);
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        throw new Error(`Failed to create a connection to the database: ${error.message}`);
    };

    logger.log('Defining database models...');

    await defineDatabaseModels(connection);

    logger.log('Registering dependencies...');

    registerDependencies();

    logger.log('Starting server...');

    const port = Number.isNaN(process.env.PORT ?? NaN)
        ? Constants.Defaults.port
        : Number(process.env.PORT);

    const server = await startServerAsync(port);

    logger.log(`Server is running`);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    const closeResourcesAsync = () => {
        return new Promise<number>(resolve => {
            server.close(async (err) => {
                let exitCode = 0;
    
                if(err) {
                    logger.error(err);
    
                    exitCode = 1;
                }
            
                await logger.beforeExit();
    
                await connection?.close();
    
                await stopServerAsync(server);

                resolve(exitCode);
            });
        });
    }

    const signalHandlerAsync = async (signal: string) => {
        logger.log(`${signal} received. Exiting...`, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            signal: signal
        });

        const exitCode = await closeResourcesAsync();

        process.exit(exitCode);
    };
    
    const gracefulShutdownAsync = async (err: Error) => {
        logger.error(err, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
        });

        const exitCode = await closeResourcesAsync();

        process.exit(exitCode);
    };
    
    const beforeExitAsync = async (exitCode: number) => {
        logger.log(`Service exited`, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            exitCode: exitCode
        });

        const serverExitCode = await closeResourcesAsync();

        process.exit(serverExitCode);
    };
    
    process.on('SIGINT', signalHandlerAsync);
    process.on('SIGTERM', signalHandlerAsync);
    process.on('uncaughtExceptionMonitor', gracefulShutdownAsync);
    process.on('beforeExit', beforeExitAsync);
}

main();