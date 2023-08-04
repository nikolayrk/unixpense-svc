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

    logger.log(`Server is running`);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    const signalHandlerAsync = async (signal: string) => {
        logger.log(`${signal} received. Exiting...`, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            signal: signal
        });
        
        await logger.beforeExit();
        
        process.exit(1);
    };
    
    const gracefulShutdownAsync = async (err: Error) => {
        logger.error(err, {
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
        });
        
        await logger.beforeExit();

        process.exitCode = 1;
    };
    
    const beforeExitAsync = async (exitCode: number) => {
        try {
            logger.log(`Service exited`, {
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                exitCode: exitCode
            });

            await logger.beforeExit();
        } catch(ex) {}

        process.exit(0);
    };
    
    process.on('SIGINT', signalHandlerAsync);
    process.on('SIGTERM', signalHandlerAsync);
    process.on('uncaughtExceptionMonitor', gracefulShutdownAsync);
    process.on('beforeExit', beforeExitAsync);
}

main();