import dotenv from 'dotenv';
import express from 'express';
import DatabaseConnection from './databaseConnection';
import googleOAuth2Middleware from './strategies/gmail/middleware/googleOAuth2Middleware';
import transactionsRouter from './routers/transactionsRouter';
import { DependencyInjector } from './dependencyInjector';
import ILogger from './contracts/ILogger';
import { injectables } from './types/injectables';

async function bootstrap() {
    dotenv.config();

    const hostname = process.env?.HOSTNAME;
    const port = process.env?.UNIXPENSE_PORT;

    if (hostname === undefined || port === undefined) {
        return;
    }

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    process.on('uncaughtExceptionMonitor', async function(this: ILogger, err: Error) {
        await DatabaseConnection.Singleton.closeAsync();

        logger.error(err);
        
        process.exit(1);
    });

    await DatabaseConnection.Singleton.tryConnectAsync();

    const app = express();

    app.use(googleOAuth2Middleware());

    app.use(transactionsRouter());

    app.listen(port, async () => {
        logger.log(`Server is running at http://${hostname}:${port}`);
    });
}
   
bootstrap();