
import express from 'express';
import dotenv from 'dotenv';
import {google} from 'googleapis';

function bootstrap(): void {
    dotenv.config();
    
    const port = process.env.PORT;
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const redirect_uri = process.env.REDIRECT_URI;

    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uri
    );

    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly'
      ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        
        scope: scopes
    });

    const app = express();

    let authenticated = false;

    app.get('/oauthcallback', async (req, res, next) => {
        const code = req.query.code?.toString();

        if (code === undefined) {
            res.send('No authorization code provided');

            return;
        }

        await oauth2Client.getToken(code, (err, token) => {
            if (err !== null) {
                res.send(err.message);

                return;
            }

            if (token === null || token === undefined) {
                return;
            }

            oauth2Client.setCredentials(token);
    
            authenticated = true;
    
            res.send('Authorized successfully');
        });
    });

    app.get('*', async(req, res, next) => {
        if (authenticated == false) {
            res.redirect(url);

            return;
        }

        next();
    });

    app.listen(port, () => {
        console.log(`[server]: Server is running at https://localhost:${port}`);
    });
}
   
bootstrap();