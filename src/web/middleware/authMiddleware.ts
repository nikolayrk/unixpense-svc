import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import Constants from '@shared/constants';
import { ResponseExtensions } from '../../core/extensions/responseExtensions';

interface AuthletResponse {
    message: string;
    data?: {
        email?: string;
    };
}

export async function protect(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ResponseExtensions.unauthorized(res, 'No access token provided');
        return;
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const authletUrl = process.env.AUTHLET_API_URL || Constants.Defaults.authletUrl;
    
    try {
        const response = await fetch(`${authletUrl}/google/validate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                access_token: accessToken
            })
        });
        
        const authletResponse = await response.json() as AuthletResponse;

        if (!response.ok) {
            ResponseExtensions.unauthorized(
                res, 
                `Authentication failed: ${authletResponse.message}` || 'Authentication failed'
            );
            return;
        }

        // Store both token and email for use in routes
        res.locals.accessToken = accessToken;
        res.locals.userEmail = authletResponse.data?.email;
        next();
    } catch (error) {
        console.error('Authlet service error:', error);
        ResponseExtensions.internalError(res, `Authlet service error: ${error}`);
    }
}
