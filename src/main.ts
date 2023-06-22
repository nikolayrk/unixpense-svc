import dotenv from 'dotenv'
dotenv.config();
import "reflect-metadata"
import express from 'express';
import { DependencyInjector } from './dependencyInjector';
import ILogger from './core/contracts/ILogger';
import { injectables } from './core/types/injectables';
import * as googleOAuth2Middleware from './web/middleware/googleOAuth2Middleware';
import { router as gmailTransactionsRouter } from './web/routes/gmailTransactionsRoutes';
import { router as swaggerRouter } from './web/routes/swaggerRoutes';
import { router as kubernetesProbesRouter } from './web/routes/kubernetesProbesRoutes';
import { router as groupsRouter } from './web/routes/groupsRoutes';
import { Sequelize } from 'sequelize-typescript';
import bodyParser from 'body-parser';

async function bootstrap() {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

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
    };
    
    process.on('SIGINT', signalHandlerAsync);
    process.on('SIGTERM', signalHandlerAsync);
    process.on('uncaughtExceptionMonitor', gracefulShutdownAsync);
    process.on('beforeExit', beforeExitAsync);

    try {
        logger.log(`Creating Database connection...`);

        const connection = new Sequelize({
            dialect: "mariadb",
            host: process.env.MARIADB_HOST ?? process.env.HOSTNAME,
            port: process.env.MARIADB_PORT !== undefined
                ? Number(process.env.MARIADB_PORT)
                : 3306,
            username: process.env.MARIADB_USER ?? '',
            password: process.env.MARIADB_PASSWORD ?? '',
            database: process.env.MARIADB_DATABASE ?? 'unixpense',
            logging: false,
            pool: {
              max: 5,
              min: 0,
              acquire: 30000,
              idle: 10000
            },
            models: [__dirname + '/**/entities/*.entity.{js,ts}'],
        });
    
        await connection.authenticate();
    
        await connection.sync();

        logger.log(`Database connection successful`);
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        return;
    }

    // Register Gmail dependencies
    DependencyInjector.Singleton.registerGmailServices();

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    
    app.use(express.json());

    // Kubernetes Startup, Readiness and Liveness Probes
    app.use(kubernetesProbesRouter);

    // Google OAuth2 Callback Route. Used for authz of all ../gmail routes, as well as for authn via oauth2-proxy
    app.use('/api/oauthcallback', googleOAuth2Middleware.redirect);

    // Gmail Transactions Routes
    app.use('/api/transactions/gmail', googleOAuth2Middleware.protect, gmailTransactionsRouter);

    // Transaction Groups Routes
    app.use('/api/groups', groupsRouter);

    // Swagger
    app.use('/swagger', swaggerRouter);

    app.listen(process.env.PORT ?? 8000, () => {
        logger.log(`Server is running`, {
            hostname: process.env.HOSTNAME ?? 'localhost',
            port: process.env.PORT ?? 8000
        });
    });
}

bootstrap();
