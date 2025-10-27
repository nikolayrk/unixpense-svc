import { Request, Response } from 'express';
import { OAuth2Service } from '../services/oauth2Service';
import { sendResponse } from '../utils/response';
import GoogleOAuth2Tokens from '@shared/models/googleOAuth2Tokens.model';

export const validateToken = async (req: Request, res: Response) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return sendResponse(res, 400, 'Access token is required');
        }

        const oauth2Service = new OAuth2Service();
        const email = await oauth2Service.resolveEmail(access_token);

        if (!email) {
            return sendResponse(res, 401, 'Invalid access token');
        }

        const tokens = await GoogleOAuth2Tokens.findOne({
            where: { user_email: email }
        });

        if (!tokens) {
            return sendResponse(res, 503, `Reauthorization required for ${email}`);
        }

        try {
            await oauth2Service.validateToken(access_token);
            return sendResponse(res, 200, 'Token is valid', { email });
        } catch (error) {
            return sendResponse(res, 401, 'Invalid access token');
        }
    } catch (error) {
        return sendResponse(res, 500, `Internal server error: ${error.message}`);
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return sendResponse(res, 400, 'Access token is required');
        }

        const oauth2Service = new OAuth2Service();
        const email = await oauth2Service.resolveEmail(access_token);

        if (!email) {
            return sendResponse(res, 401, 'Invalid access token');
        }

        const tokens = await GoogleOAuth2Tokens.findOne({
            where: { user_email: email }
        });

        if (!tokens) {
            return sendResponse(res, 404, 'No refresh token found');
        }

        const newTokens = await oauth2Service.refreshTokens(email, tokens.refresh_token);
        return sendResponse(res, 200, 'Token refreshed successfully', {
            access_token: newTokens.access_token
        });
    } catch (error) {
        return sendResponse(res, 500, `Internal server error: ${error.message}`);
    }
};

export const handleCallback = async (req: Request, res: Response) => {
    const { code, redirect_uri } = req.body;

    if (!code) {
        return sendResponse(res, 403, 'No authorization code provided');
    }

    try {
        const oauth2Service = new OAuth2Service(redirect_uri);
        const tokens = await oauth2Service.authorize(code);
        res.status(200).json(tokens);
    } catch (error) {
        return sendResponse(res, 500, `Authorization failed: ${error.message}`);
    }
};
