import { Request, Response, NextFunction } from "express";
import { sendResponse } from '../utils/response';

export function validateClientCredentials(req: Request, res: Response, next: NextFunction) {
    const { client_id, client_secret } = req.body;
    
    if (!client_id || !client_secret) {
        return sendResponse(res, 401, 'No credentials provided');
    }

    if (client_id !== process.env.GOOGLE_OAUTH2_CLIENT_ID || 
        client_secret !== process.env.GOOGLE_OAUTH2_CLIENT_SECRET) {
        return sendResponse(res, 401, 'Invalid credentials');
    }

    next();
}
