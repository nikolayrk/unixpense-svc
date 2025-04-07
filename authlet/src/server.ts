import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRouter from './router';

export function createServer() {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Swagger setup
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            // servers: [
            //     { url: `${process.env.UNIXPENSE_HOST_PREFIX ?? ''}/auth/api` }
            // ],
            info: {
                title: 'Unixpense Authlet API',
                version: process.env.VERSION ?? 'develop',
                description: 'Authentication service for Unixpense'
            },
        },
        apis: ['./**/src/router.{js,ts}'],
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    
    app.use('/swagger', swaggerUi.serve as unknown as express.RequestHandler[]);
    app.use('/swagger', swaggerUi.setup(swaggerSpec) as unknown as express.RequestHandler[]);

    app.use('/', authRouter);

    return app;
}
