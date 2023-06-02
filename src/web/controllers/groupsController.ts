import { Request, Response } from "express";
import { ResponseExtensions } from "../../shared/extensions/responseExtensions";

const newGroup = async (req: Request, res: Response) => {
    try {
        const result = {}; // TODO
        
        return ResponseExtensions.added(res, 1, 'group');
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const get = async (req: Request, res: Response) => {
    const group = req.params.group;

    if (group === "") {
        return ResponseExtensions.badRequest(res, "No group provided");
    }

    try {
        const result = {}; // TODO
        
        return ResponseExtensions.ok(res, result);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const getAll = async (req: Request, res: Response) => {
    try {
        const result = {}; // TODO
        
        return ResponseExtensions.ok(res, result);
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const deleteGroup = async (req: Request, res: Response) => {
    const group = req.params.group;

    if (group === "") {
        return ResponseExtensions.badRequest(res, "No group provided");
    }

    // TODO

    return ResponseExtensions.noContent(res);
};

export { newGroup as new, get, getAll, deleteGroup as delete }