import express from 'express';
import cors from 'cors';
import authRouter from './router';
import { sendResponse } from './utils/response';

export function createServer() {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/', authRouter);

    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        sendResponse(res, 500, 'ERROR', `Internal Server Error: ${err.message}`);
    });

    return app;
}
