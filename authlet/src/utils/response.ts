import { Response } from 'express';

export function sendResponse(
    res: Response,
    statusCode: number,
    message: string,
    data?: any
) {
    res.status(statusCode).json({
        message,
        ...(data && { data })
    });
}
