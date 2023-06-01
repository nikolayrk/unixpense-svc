import { Response } from "express";

export class ResponseExtensions {    
    public static ok = (res: Response, response: object | string) => ResponseExtensions.jsonResponse(res, 200, response);
    
    public static added = (res: Response, added: number) => ResponseExtensions.jsonResponse(res, 201, { message: `Added ${added} transaction${added == 1 ? '' : 's'} to database`});
    
    public static badRequest = (res: Response, message: string) => ResponseExtensions.jsonResponse(res, 400, { error: message });
    
    public static internalError = (res: Response, message: string) => ResponseExtensions.jsonResponse(res, 500, { error: message });

    private static jsonResponse = (res: Response, status: number, response: object | string) => res
        .status(status)
        .json(typeof response === 'object'
            ? response
            : { response })
        .end();
}