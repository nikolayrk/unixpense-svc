import express from 'express';
import { router as transactionsRouter } from '../src/web/routes/transactionsRoutes';
import { router as gmailTransactionsRouter } from '../src/web/routes/gmailTransactionsRoutes';
import { router as swaggerRouter } from '../src/web/routes/swaggerRoutes';
import { router as healthRouter } from '../src/web/routes/healthRoutes';
import { router as groupsRouter } from '../src/web/routes/groupsRoutes';
import { router as groupRulesRouter } from '../src/web/routes/groupRulesRoutes';
import bodyParser from 'body-parser';
import { Server } from 'http';
import { limiter as rateLimiter } from '../src/web/middleware/rateLimiter';
import Constants from '@shared/constants';
import { protect } from './web/middleware/authMiddleware';
import ILogger from './core/contracts/ILogger';

const startServerAsync = (logger: ILogger) => {
    const port = Number.isNaN(process.env.PORT ?? NaN)
        ? Constants.Defaults.port
        : Number(process.env.PORT);

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(express.json());

    // Startup, Readiness and Liveness Probes
    app.use(healthRouter);

    app.use(rateLimiter((req, res, next, options) => {
        logger.warn(`Rate limit reached`, { ip: req.ip, path: req.path });

        res.status(options.statusCode).end(options.message);
    }));

    // Transactions Routes
    app.use('/api/transactions', transactionsRouter);

    // Gmail Transactions Routes
    app.use('/api/transactions/gmail', protect, gmailTransactionsRouter);

    // Transaction Groups Routes
    app.use('/api/groups', groupsRouter);
    app.use('/api/groups/:group/rules', groupRulesRouter);

    // Swagger
    app.use('/swagger', swaggerRouter);

    const server = new Promise<Server>((resolve) => {
        const server: Server = app.listen(port, () => resolve(server));
    });

    return server;
};

const stopServerAsync = async (app: Server) =>
    new Promise<void>((resolve) =>
        app.on('close', () => resolve())
            .close());

export {
    startServerAsync,
    stopServerAsync
}
