import winston, { createLogger, transport } from 'winston';
import LokiTransport from 'winston-loki';
import ILogger from '../../core/contracts/ILogger';
import { injectable } from 'inversify';
import Constants from '../../constants';

@injectable()
export default class WinstonLokiLogger implements ILogger {
    private readonly labels = {
        job: 'unixpense',
        host: Constants.host,
        
        ...(process.env.VERSION !== undefined) && {
            version: process.env.VERSION
        }
    } as const;
    
    private readonly logger: winston.Logger;
    
    public constructor() {
        const level = process.env.LOG_LEVEL ?? 'info';

        const consolePrintHandler = (info: winston.Logform.TransformableInfo): string => {
            const { message, level, stack, labels } = info;
            const labelStrings = Object.entries({ ...labels })
                .map(([k, v]) => `\n\t[${k}]\t${v}`)
                .join('');

            return 'stack' in info
                ? `${level}:\t${message}\n${stack}${labelStrings}`
                : `${level}:\t${message}${labelStrings}`;
            };
            
        const lokiPrintHandler = (info: winston.Logform.TransformableInfo): string => 'stack' in info
            ? `${info.message}\n${info.stack}`
            : `${info.message}`;

        const colorOptions = {
            message: true,
            colors: {
                info: 'white',
                warn: 'yellow',
                error: 'red'
            }
        };

        const errorFormat = winston.format.errors({ stack: true });
        const colorFormat = winston.format.colorize(colorOptions);
        const noColorFormat = winston.format.uncolorize();
        const consoleFormat = winston.format.printf((consolePrintHandler));
        const mainFormat = winston.format.combine(errorFormat, colorFormat, consoleFormat);
        const lokiFormat = winston.format.printf(lokiPrintHandler);

        const consoleOptions = { format: noColorFormat };
        const lokiOptions = {
            host: process.env.LOKI_HOST!,
            batching: false,
            gracefulShutdown: true,
            format: lokiFormat
        };

        const consoleTransportUncolorized = new winston.transports.Console(consoleOptions);
        const consoleTransport = new winston.transports.Console();
        const lokiTransport = process.env.LOKI_HOST !== undefined
            ? new LokiTransport(lokiOptions)
            : undefined;
        const transports = process.env.NODE_ENV === 'production'
            ? [consoleTransportUncolorized, lokiTransport].filter(t => t !== undefined) as transport[]
            : consoleTransport;

        this.logger = createLogger({
            exitOnError: false,
            level: level,
            format: mainFormat,
            transports: transports
        });
    }

    public log(message: string, labels?: Record<string, unknown>) {
        this.logger.info(message, { labels: { ...this.labels, ...labels } });
    }

    public warn(message: string, labels?: Record<string, unknown>) {
        this.logger.warn(message, { labels: { ...this.labels, ...labels } });
    }

    public error(error: Error, labels?: Record<string, unknown>) {
        this.logger.log('error', { message: error, labels: { ...this.labels, ...labels } });
    }

    public beforeExit() {
        this.logger.end();

        return new Promise<void>((resolve) => this.logger.on('finish', () => resolve()));
    }
}