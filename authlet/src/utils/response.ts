import { Response } from 'express';

export interface ApiResponse {
    status: 'UP' | 'DOWN' | 'ERROR';
    message: string;
}

export function sendResponse(
    res: Response,
    statusCode: number,
    status: ApiResponse['status'],
    message: string
): void {
    res.status(statusCode).json({
        status,
        message
    });
}
