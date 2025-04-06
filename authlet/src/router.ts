import express from 'express';
import { google } from 'googleapis';
import GoogleOAuth2Tokens from '@shared/models/googleOAuth2Tokens.model';
import { sendResponse } from './utils/response';

const oauth2Client = new google.auth.OAuth2();

async function handleInvalidAccessTokenAsync(tokens: any) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token || !credentials.refresh_token) {
        throw new Error('Reauthorization required');
    }

    await tokens.update({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token
    });
}

async function checkAuthenticationStatus(req: express.Request, res: express.Response) {
    try {
        const email = req.query.email as string;
        if (!email) {
            return sendResponse(res, 400, 'DOWN', `Email parameter is required`);
        }

        const tokens = await GoogleOAuth2Tokens.findOne({
            where: { user_email: email }
        });
        
        if (!tokens) {
            return sendResponse(res, 503, 'DOWN', `Reauthorization required for ${email}`);
        }

        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });

        try {
            await oauth2Client.getAccessToken();
        } catch (error) {
            try {
                await handleInvalidAccessTokenAsync(tokens);
            } catch (refreshError) {
                return sendResponse(
                    res, 
                    503, 
                    'DOWN', 
                    `Reauthorization required for ${email}: ${refreshError.message}`
                );
            }
        }

        return sendResponse(res, 200, 'UP', 'Authentication valid');
    } catch (error) {
        return sendResponse(
            res, 
            500, 
            'DOWN', 
            `Internal server error: ${error.message}`
        );
    }
}

// Create the router
const router = express.Router();
router.get('/authenticated', checkAuthenticationStatus);

// Add the default export
export default router;
