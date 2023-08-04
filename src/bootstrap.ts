
import express from 'express';
import * as googleOAuth2Middleware from './web/middleware/googleOAuth2Middleware';
import { router as gmailTransactionsRouter } from './web/routes/gmailTransactionsRoutes';
import { router as swaggerRouter } from './web/routes/swaggerRoutes';
import { router as kubernetesProbesRouter } from './web/routes/kubernetesProbesRoutes';
import { router as groupsRouter } from './web/routes/groupsRoutes';
import { Sequelize } from 'sequelize-typescript';
import bodyParser from 'body-parser';
import ILogger from './core/contracts/ILogger';
import { DependencyInjector } from './dependencyInjector';
import * as mariadb from 'mariadb';
import { Server } from 'http';

const createDatabaseIfNotExistsAsync = async (host: string, port: number, username: string, password: string, database: string) => {
    const pool = mariadb.createPool({
        host: host,
        port: port,
        user: username,
        password: password
    });

    const conn = await pool.getConnection();

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    await conn.release();

    await pool.end();
}

const createDatabaseConnectionAsync = async(host: string, port: number, username: string, password: string, database: string, logger: ILogger) => {
    try {
        await createDatabaseIfNotExistsAsync(host, port, username, password, database);

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
            models: [__dirname + '/**/entities/*.entity.{js,ts}'],
        });
    
        await connection.authenticate();
    
        await connection.sync();

        return connection;
    } catch(ex) {
        const error = ex as Error;

        logger.error(error);

        return null;
    }
}

const registerDependencies = () => {
    DependencyInjector.Singleton.registerGmailServices();
}

const startServerAsync = (port: number) => {
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

    const server = new Promise<Server>((resolve) => {
        const server: Server = app.listen(port, () => resolve(server));
    });

    return server;
};

export { createDatabaseConnectionAsync, registerDependencies, startServerAsync }