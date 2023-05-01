import DatabaseConnection from "../../databaseConnection";
import { DependencyInjector } from "../../dependencyInjector";
import ILogger from "../../services/contracts/ILogger";
import { injectables } from "../../shared/types/injectables";
import express from "express";

const signalHandlerAsync = async (signal: string) => {
    const error = new Error(`${signal} received. Exiting...`);

    gracefulShutdownAsync(error);
};

const gracefulShutdownAsync = async (err: Error) => {
    await DatabaseConnection.Singleton.closeAsync();

    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
    
    logger.error(err);
    
    process.exitCode = 1;
};

const beforeExitAsync = async (exitCode: number) => {
    const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

    logger.log(`Service exited`, { exitCode: exitCode });

    await logger.beforeExit();
};

process.on('SIGINT', () => signalHandlerAsync);
process.on('SIGTERM', () => signalHandlerAsync);
process.on('uncaughtExceptionMonitor', gracefulShutdownAsync);
process.on('beforeExit', beforeExitAsync);

const router = express.Router();

router.use('/healthz', (req, res) => res.status(200).json({ status: "ok" }));
router.use('/alivez', (req, res) => res.status(200).json({ status: "ok" }));
router.use('/readyz', (req, res) => res.status(200).json({ status: "ok" }));

export { router };