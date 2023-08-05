import { Request, Response } from "express";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";

const newRule = async (req: Request, res: Response) => {
    const result = {}; // TODO
    
    return ResponseExtensions.added(res, 1, 'rule');
};

const get = async (req: Request, res: Response) => {
    const group = req.params.group;
    const ruleId = req.params.id;
    
    const result = {}; // TODO
    
    return ResponseExtensions.ok(res, result);
};

const getAll = async (req: Request, res: Response) => {
    const result: string[] = []; // TODO
    
    return ResponseExtensions.ok(res, result);
};

const deleteRule = async (req: Request, res: Response) => {
    const group = req.params.group;
    const ruleId = req.params.id;

    // TODO

    return ResponseExtensions.noContent(res);
};

export { newRule as new, get, getAll, deleteRule as delete }