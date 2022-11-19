import express from 'express';
import dotenv from 'dotenv';
import GmailClient from './clients/gmailClient';
import TransactionBuilder from './builders/transactionBuilder';
import getTransactionsRouter from './routers/getTransactionsRouter';
import GoogleApiAuth from './middleware/googleApiAuth';
import TransactionRepository from './repositories/transactionRepository';
import createDatabaseConnection from './utils/createDatabaseConnection';
import PaymentDetailsRepository from './repositories/paymentDetailsRepository';
import refreshRouter from './routers/refreshRouter';

async function bootstrap() {
    dotenv.config();
    
    const port = process.env.PORT;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUsername = process.env.DB_USERNAME;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = "unixpense";

    if (clientId === undefined || 
        clientSecret === undefined || 
        redirectUri === undefined) {
        console.log(`Missing OAuth2 credentials. Exiting...`);

        return;
    }

    if (dbHost === undefined || 
        dbPort === undefined || 
        dbUsername === undefined || 
        dbPassword === undefined || 
        dbName === undefined) {
        console.log(`Missing Database connection details. Exiting...`);

        return;
    }

    try {
        const googleApiAuth = new GoogleApiAuth(clientId, clientSecret, redirectUri);
        const gmailClient = new GmailClient(googleApiAuth.oauth2Client);
        const transactionBuilder = new TransactionBuilder(gmailClient);
        
        const dbConnection = await createDatabaseConnection(dbHost, Number(dbPort), dbUsername, dbPassword, dbName);
        const transactionRepository = new TransactionRepository();
        const paymentDetailsRepository = new PaymentDetailsRepository();

        const app = express();

        app.use('/oauthcallback', googleApiAuth.callback);
        app.use(googleApiAuth.ensureAuthenticated, getTransactionsRouter(gmailClient, transactionBuilder));
        app.use(googleApiAuth.ensureAuthenticated, refreshRouter(
            gmailClient,
            transactionBuilder,
            dbConnection,
            transactionRepository,
            paymentDetailsRepository));

        app.listen(port, () => {
            console.log(`[server]: Server is running at https://localhost:${port}`);
        });
    } catch (ex) {
        if (ex instanceof Error) {
            console.log(`Fatal Error: ${ex.stack}`);
            console.log('Exiting...');

            return;
        }
        
        console.log(ex);
    }
}
   
bootstrap();