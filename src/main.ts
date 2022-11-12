import express from 'express';
import dotenv from 'dotenv';
import GmailClient from './clients/gmailClient';
import TransactionBuilder from './builders/transactionBuilder';
import getTransactionsRouter from './routes/getTransactionsRouter';
import GoogleApiAuth from './middleware/googleApiAuth';

function bootstrap(): void {
    dotenv.config();
    
    const port = process.env.PORT;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    if (clientId === undefined || clientSecret === undefined || redirectUri === undefined) {
        console.log(`Missing OAuth2 credentials. Exiting...`);

        return;
    }

    const googleApiAuth = new GoogleApiAuth(clientId, clientSecret, redirectUri);
    const gmailClient = new GmailClient(googleApiAuth.oauth2Client);
    const transactionBuilder = new TransactionBuilder(gmailClient);

    const app = express();

    app.use('/oauthcallback', googleApiAuth.callback);
    app.use(googleApiAuth.ensureAuthenticated, getTransactionsRouter(gmailClient, transactionBuilder));

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();