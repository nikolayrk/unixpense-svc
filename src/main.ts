import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import DatabaseConnection from './databaseConnection';
import { router as googleOAuth2Middleware } from './services/strategies/gmail/middleware/googleOAuth2Middleware';
import { DependencyInjector } from './dependencyInjector';
import ILogger from './services/contracts/ILogger';
import { injectables } from './shared/types/injectables';
import { router as transactionsRouter } from './routes/transactionsRoutes';

async function bootstrap() {
    const hostname = process.env?.HOSTNAME;
    const port = process.env?.UNIXPENSE_PORT;

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    process.on('uncaughtExceptionMonitor', async function(this: ILogger, err: Error) {
        await DatabaseConnection.Singleton.closeAsync();

        logger.error(err);
        
        process.exitCode = 1;
    });

    process.on('beforeExit', (exitCode) => {
        logger.log(`Service exited`, { exitCode: exitCode });

        // TODO: await Loki transport flush
        });

    await DatabaseConnection.Singleton.tryConnectAsync();

    const app = express();

    app.use(googleOAuth2Middleware);

    app.use('/api/transactions', transactionsRouter);

    app.listen(port, () => {
        logger.log(`Server is running`, { hostname: hostname, port: port });
    });
}

bootstrap();
