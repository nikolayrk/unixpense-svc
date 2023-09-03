import rateLimit from "express-rate-limit";
import { DependencyInjector } from "../../dependencyInjector";
import ILogger from "../../core/contracts/ILogger";
import { injectables } from "../../core/types/injectables";

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
    handler: (req, res, next, options) => {
        const logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

        logger.warn(`Rate limit reached`, { ip: req.ip, path: req.path });

        res.status(options.statusCode).end(options.message);
    }
});