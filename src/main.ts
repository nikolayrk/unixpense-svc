import express from 'express';
import dotenv from 'dotenv';
import Authentication from './middleware/authentication';
import GmailClient from './clients/gmailClient';
import { google } from 'googleapis';
import TransactionBuilder from './builders/transactionBuilder';
import getTransactionsRouter from './routes/getTransactionsRouter';

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

    const transactionBuilder = new TransactionBuilder(gmailClient);

    app.use('/gettransactions', authentication.ensureAuthenticated, getTransactionsRouter(gmailClient, transactionBuilder));

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();