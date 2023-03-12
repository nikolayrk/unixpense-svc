import express from 'express';
import dotenv from 'dotenv';
import GmailClient from './clients/gmailClient';
import TransactionBuilder from './builders/transactionBuilder';
import getTransactionsRouter from './routers/getTransactionsRouter';
import TransactionRepository from './repositories/transactionRepository';
import createDatabaseConnection from './utils/createDatabaseConnection';
import PaymentDetailsRepository from './repositories/paymentDetailsRepository';
import refreshRouter from './routers/refreshRouter';
import PaymentDetailsBuilder from './builders/paymentDetailsBuilder';
import TransactionFactory from './factories/transactionFactory';
import CardOperationFactory from './factories/cardOperationFactory';
import CrossBorderTransferFactory from './factories/crossBorderTransferFactory';
import StandardFeeFactory from './factories/standardFeeFactory';
import StandardTransferFactory from './factories/standardTransferFactory';
import RefreshTokenRepository from './repositories/refreshTokenRepository';
import OAuth2ClientProvider from './providers/oauth2ClientProvider';
import googleAuthMiddleware from './middleware/googleAuthMiddleware';

async function bootstrap() {
    dotenv.config();
    
    const hostname = process.env.HOSTNAME;
    const port = process.env.UNIXPENSE_PORT;
    const clientId = process.env.UNIXPENSE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.UNIXPENSE_GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.UNIXPENSE_GOOGLE_REDIRECT_URI;

    const dbHost = process.env.UNIXPENSE_MARIADB_HOST;
    const dbPort = process.env.UNIXPENSE_MARIADB_PORT;
    const dbUsername = process.env.UNIXPENSE_MARIADB_USERNAME;
    const dbPassword = process.env.UNIXPENSE_MARIADB_PASSWORD;
    const dbName = process.env.UNIXPENSE_MARIADB_DATABASE;

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
        const dbConnection = await createDatabaseConnection(dbHost, Number(dbPort), dbUsername, dbPassword, dbName);

        const refreshTokenRepository = new RefreshTokenRepository();
        const oauth2ClientProvider = new OAuth2ClientProvider(clientId, clientSecret, redirectUri, refreshTokenRepository);
        const gmailClient = new GmailClient(oauth2ClientProvider);
        
        const cardOperationFactory = new CardOperationFactory();
        const crossBorderTransferFactory = new CrossBorderTransferFactory();
        const standardFeeFactory = new StandardFeeFactory();
        const standardTransferFactory = new StandardTransferFactory();
        const paymentDetailsBuilder = new PaymentDetailsBuilder(cardOperationFactory, crossBorderTransferFactory, standardFeeFactory, standardTransferFactory);
        const transactionFactory = new TransactionFactory(paymentDetailsBuilder);
        const transactionBuilder = new TransactionBuilder(gmailClient, transactionFactory);
        
        const transactionRepository = new TransactionRepository();
        const paymentDetailsRepository = new PaymentDetailsRepository();

        const app = express();

        app.use(googleAuthMiddleware(oauth2ClientProvider));

        app.use(getTransactionsRouter(gmailClient, transactionBuilder));
        app.use(refreshRouter(
            gmailClient,
            transactionBuilder,
            dbConnection,
            transactionRepository,
            paymentDetailsRepository));

        app.listen(port, () => {
            console.log(`[server]: Server is running at https://${hostname}:${port}`);
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