import express from 'express';
import dotenv from 'dotenv';
import GetAttachmentsRoute from './routes/getMessagesRoute';
import Authentication from './middleware/authentication';

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

    const getMessagesRoute = new GetAttachmentsRoute(authentication.oauth2Client);

    app.get('/getattachments', authentication.ensureAuthenticated, getMessagesRoute.route);

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();