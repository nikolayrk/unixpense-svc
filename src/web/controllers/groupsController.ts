import { Request, Response } from "express";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";

const newGroup = async (req: Request, res: Response) => {
    const result = {}; // TODO
    
    return ResponseExtensions.added(res, 1, 'group');
};

const get = async (req: Request, res: Response) => {
    const group = req.params.group;

    const result = {}; // TODO
    
    return ResponseExtensions.ok(res, result);
};

const getAll = async (req: Request, res: Response) => {
    const result: string[] = []; // TODO
    
    return ResponseExtensions.ok(res, result);
};

const deleteGroup = async (req: Request, res: Response) => {
    const group = req.params.group;
    
    // TODO

    return ResponseExtensions.noContent(res);
};

export { newGroup as new, get, getAll, deleteGroup as delete }