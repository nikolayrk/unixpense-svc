import dotenv from 'dotenv';
import express from 'express';
import DatabaseConnection from './databaseConnection';
import googleOAuth2Middleware from './middleware/googleOAuth2Middleware';
import getTransactionsRouter from './routers/getTransactionsRouter';
import refreshRouter from './routers/refreshRouter';

async function bootstrap() {
    const env = dotenv.config();

    const hostname = env.parsed?.HOSTNAME;
    const port = env.parsed?.UNIXPENSE_PORT;

    if (hostname === undefined || port === undefined) {
        return;
    }

    try {
        await DatabaseConnection.Singleton.tryConnectAsync();

        const app = express();

        app.use(googleOAuth2Middleware());

        app.use(getTransactionsRouter());
        app.use(refreshRouter());

        app.listen(port, () => {
            console.log(`Server is running at http://${hostname}:${port}`);
        });
    } catch (ex) {
        const body = ex instanceof Error
            ? `${ex.message}\n\n${ex.stack}`
            : ex;
        
        console.log('Unhandled server error:');
        console.log(body);
        console.log('');
        console.log('Closing database connection...');

        await DatabaseConnection.Singleton.closeAsync();

        console.log('Exiting...');

        process.exit(1);
    }
}
   
bootstrap();