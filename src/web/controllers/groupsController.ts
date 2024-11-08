import { Request, Response } from "express";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";

const newGroup = async (req: Request, res: Response) => {
    const result = {}; // TODO
    
    ResponseExtensions.added(res, 1, 'group');
};

const get = async (req: Request, res: Response) => {
    const group = req.params.group;

    const result = {}; // TODO
    
    ResponseExtensions.ok(res, result);
};

const getAll = async (req: Request, res: Response) => {
    const result: string[] = []; // TODO
    
    ResponseExtensions.ok(res, result);
};

const deleteGroup = async (req: Request, res: Response) => {
    const group = req.params.group;
    
    // TODO

    ResponseExtensions.noContent(res);
};

export { newGroup as new, get, getAll, deleteGroup as delete }