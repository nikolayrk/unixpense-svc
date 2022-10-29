import express from 'express';
import dotenv from 'dotenv';
import GetTransactionsRoute from './routes/getTransactionsRoute';
import Authentication from './middleware/authentication';
import GmailClient from './clients/gmailClient';
import { google } from 'googleapis';
import TransactionBuilder from './builders/transactionBuilder';
import TransactionFactory from './factories/transactionFactory';

function bootstrap(): void {
    dotenv.config();
    
    const port = process.env.PORT;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    if (clientId === undefined) {
        console.log(`Missing client ID`);

        return;
    }

    if (clientSecret === undefined) {
        console.log(`Missing client secret`);

        return;
    }

    if (redirectUri === undefined) {
        console.log(`Missing redirect URI`);

        return;
    }

    const app = express();

    const authentication = new Authentication(clientId, clientSecret, redirectUri);

    app.use('/oauthcallback', authentication.oauth2Callback);

    const gmailApi = google.gmail({version: 'v1', auth: authentication.oauth2Client});
    const gmailClient = new GmailClient(gmailApi);

    const transactionFactory = new TransactionFactory();
    const transactionBuilder = new TransactionBuilder(gmailClient, transactionFactory);

    const getAttachmentsRoute = new GetTransactionsRoute(transactionBuilder);

    app.get('/gettransactions', authentication.ensureAuthenticated, getAttachmentsRoute.route);

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();