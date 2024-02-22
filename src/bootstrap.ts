import express from 'express';
import * as googleOAuth2Middleware from './web/middleware/googleOAuth2Middleware';
import { router as transactionsRouter } from './web/routes/transactionsRoutes';
import { router as gmailTransactionsRouter } from './web/routes/gmailTransactionsRoutes';
import { router as swaggerRouter } from './web/routes/swaggerRoutes';
import { router as kubernetesProbesRouter } from './web/routes/kubernetesProbesRoutes';
import { router as groupsRouter } from './web/routes/groupsRoutes';
import { Sequelize } from 'sequelize-typescript';
import bodyParser from 'body-parser';
import { DependencyInjector } from './dependencyInjector';
import * as mariadb from 'mariadb';
import { Server } from 'http';
import { limiter as rateLimiter } from './web/middleware/rateLimiter';
import { Umzug, SequelizeStorage, InputMigrations, Resolver, MigrationParams } from 'umzug';
import fs from 'fs';
import RepositoryError from './core/errors/repositoryError';

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

const createDatabaseConnectionAsync = async (host: string, port: number, username: string, password: string, database: string) => {
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
        dialectOptions: {
            multipleStatements: true
        }
    });
    
    await connection.authenticate();
    
    return connection;
}

const defineDatabaseModels = async (connection: Sequelize) => {
    connection.addModels([__dirname + '/**/models/*.model.{js,ts}']);

    await connection.sync();
}

const resolveMigrationTool = (connection: Sequelize) => {
    const resolveMigrationFileContentsAsync = (path: string) => new Promise<string>(resolve =>
        fs.readFile(path, (err, data) => {
            if (err) throw err;
            if (data) resolve(data.toString());
        })
    );

    const executeQueryAsync = async (context: Sequelize, path: string) => {
        const sql = await resolveMigrationFileContentsAsync(path);

        try {
            const [results, ] = await context.query(sql);
            
            return results;
        } catch (ex) {
            if (ex instanceof Error) {
                throw new RepositoryError(ex);
            }
        }
    }
    
    const resolver: Resolver<Sequelize> = (params: MigrationParams<Sequelize>) => {
        if (!params.path?.endsWith('.sql')) {
            return Umzug.defaultResolver(params);
        }

        return {
            name: params.name,
            up: async () => executeQueryAsync(params.context, params.path!),
            // eslint-disable-next-line
            down: async () => executeQueryAsync(params.context, params.path?.replace('.up.sql', '.down.sql')!)
        };
    };
    
    const migrations: InputMigrations<Sequelize> = {
        glob: __dirname + '/**/migrations/*.{js,ts,up.sql}',
        resolve: resolver
    };

    const storage = new SequelizeStorage({ sequelize: connection });

    const umzug = new Umzug({
        migrations,
        storage,
        context: connection,
        logger: console,
    });

    return umzug;
}

const applyDatabaseMigrationsAsync = async (umzug: Umzug<Sequelize>, step?: number) => {
    if (step === undefined) {
        await umzug.up();
    } else {
        await umzug.up({ step });
    }
}

const revertDatabaseMigrationsAsync = async (umzug: Umzug<Sequelize>, step?: number) => {
    if (step === undefined) {
        await umzug.down();
    } else {
        await umzug.down({ step });
    }
}

const registerDependencies = () => {
    DependencyInjector.Singleton.registerGmailServices();
}

const startServerAsync = (port?: number) => {
    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(express.json());

    // Kubernetes Startup, Readiness and Liveness Probes
    app.use(kubernetesProbesRouter);

    app.use(rateLimiter);

    // Google OAuth2 Callback Route. Used for authz of all ../gmail routes, as well as for authn via oauth2-proxy
    app.use('/api/oauthcallback', googleOAuth2Middleware.redirect);

    // Transactions Routes
    app.use('/api/transactions', transactionsRouter);

    // Gmail Transactions Routes
    app.use('/api/transactions/gmail', googleOAuth2Middleware.protect, gmailTransactionsRouter);

    // Transaction Groups Routes
    app.use('/api/groups', groupsRouter);

    // Swagger
    app.use('/swagger', swaggerRouter);

    const finalPort = port ?? Math.round(Math.random() * (65535 - 1024) + 1024);

    process.env.port = String(finalPort);

    const server = new Promise<Server>((resolve) => {
        const server: Server = app.listen(finalPort, () => resolve(server));
    });

    return server;
};

const stopServerAsync = async (app: Server) =>
    new Promise<void>((resolve) =>
        app.on('close', () => resolve())
            .close());

export {
    createDatabaseConnectionAsync,
    defineDatabaseModels,
    resolveMigrationTool,
    applyDatabaseMigrationsAsync,
    revertDatabaseMigrationsAsync,
    registerDependencies,
    startServerAsync,
    stopServerAsync
}
