import winston, { createLogger } from 'winston';
import LokiTransport from 'winston-loki';
import ILogger from '../contracts/ILogger';
import { injectable } from 'inversify';

@injectable()
export default class WinstonLokiLogger implements ILogger {
    private readonly logger: winston.Logger;
    
    public constructor() {
        this.logger = createLogger({
            exitOnError: false,
            level: process.env.LOG_LEVEL ?? 'info',
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.colorize({
                    message: true,
                    colors: {
                        info: 'white',
                        warn: 'yellow',
                        error: 'red'
                    }
                }),
                winston.format.printf((info => {
                    const { message, level, stack, labels } = info;
                    const labelStrings = Object.entries({ ...labels })
                        .map(([k, v]) => `\n\t[${k}]\t${v}`)
                        .join('');

                    return 'stack' in info
                        ? `${level}:\t${message}\n${stack}${labelStrings}`
                        : `${level}:\t${message}${labelStrings}`
                }))
            ),
            transports: process.env.NODE_ENV === 'production'
                ? process.env.LOKI_HOST !== undefined
                    // Production env w/ Loki
                    ? [ new winston.transports.Console({ format: winston.format.uncolorize() }),
                        new LokiTransport({
                            host: process.env.LOKI_HOST,
                            batching: false,
                            format: winston.format.printf((info => 'stack' in info
                                ? `${info.message}\n${info.stack}`
                                : `${info.message}`))
                        })]
                    // Production env w/o Loki
                    : new winston.transports.Console({ format: winston.format.uncolorize() })
                // Development env
                : new winston.transports.Console()
        });
    }

    public log(message: string, labels?: Record<string, unknown>) {
        this.logger.info(message, { labels: labels });
    }

    public warn(message: string, labels?: Record<string, unknown>) {
        this.logger.warn(message, { labels: labels });
    }

    public error(error: Error, labels?: Record<string, unknown>) {
        this.logger.log('error', { message: error, labels: labels });
    }
}