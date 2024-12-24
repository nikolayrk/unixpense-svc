import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import { createDatabaseConnectionAsync, defineDatabaseModels } from '@shared/database';
import { Sequelize } from 'sequelize-typescript';
import { startServerAsync, stopServerAsync } from './server';

const main = async () => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log('Creating database connection...');

    let connection: Sequelize | null = null;

    try {
        connection = await createDatabaseConnectionAsync();
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        throw new Error(`Failed to create a connection to the database: ${error.message}`);
    };

    logger.log('Defining database models...');

    await defineDatabaseModels(connection);

    logger.log('Registering dependencies...');

    DependencyInjector.Singleton.registerGmailServices();

    logger.log('Starting server...');

    const server = await startServerAsync();

    logger.log(`Server is running`);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    if (process.env.NODE_ENV === 'test_integration') {
        const mocks = await import('./mocks');

        await mocks.applyGoogleMocksAsync();

        logger.log(`Mocks applied`);
    }

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