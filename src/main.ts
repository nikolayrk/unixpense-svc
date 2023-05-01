import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import DatabaseConnection from './databaseConnection';
import { DependencyInjector } from './dependencyInjector';
import ILogger from './services/contracts/ILogger';
import { injectables } from './shared/types/injectables';
import { router as gmailTransactionsRouter } from './web/routes/gmailTransactionsRoutes';
import { router as swaggerRouter } from './web/routes/swaggerRoutes';
import { router as kubernetesProbesRouter } from './web/routes/kubernetesProbesRoutes';

async function bootstrap() {
    const hostname = process.env?.HOSTNAME;
    const port = process.env?.PORT;

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log(`Service started`, {
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
    });

    const app = express();

    await DatabaseConnection.Singleton.tryConnectAsync();

    // Kubernetes Startup, Readiness and Liveness Probes
    app.use(kubernetesProbesRouter);

    // Swagger
    app.use('/swagger', swaggerRouter);

    // Gmail Transactions Routes
    app.use('/api/transactions/gmail', gmailTransactionsRouter);

    app.listen(port, () => {
        logger.log(`Server is running`, { hostname: hostname, port: port });
    });
}

bootstrap();
