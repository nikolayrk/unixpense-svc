import { Request, Response } from "express";
import { ResponseExtensions } from "../../core/extensions/responseExtensions";

const newRule = async (req: Request, res: Response) => {
    try {
        const result = {}; // TODO
        
        return ResponseExtensions.added(res, 1, 'rule');
    } catch (ex) {
        const error = ex as Error;

        return ResponseExtensions.internalError(res, error.message ?? ex);
    }
};

const get = async (req: Request, res: Response) => {
    const group = req.params.rule_id;

    if (group === "") {
        return ResponseExtensions.badRequest(res, "No group provided");
    }

    const ruleId = req.params.rule_id;

    if (ruleId === "") {
        return ResponseExtensions.badRequest(res, "No rule_id provided");
    }
    
    const ruleIdValue = Number(ruleId);

    if (Number.isNaN(ruleId) || ruleIdValue < 1) {
        return ResponseExtensions.badRequest(res, "Invalid rule_id provided");
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

const deleteRule = async (req: Request, res: Response) => {
    const group = req.params.rule_id;

    if (group === "") {
        return ResponseExtensions.badRequest(res, "No group provided");
    }
    
    const ruleId = req.params.rule_id;

    if (ruleId === "") {
        return ResponseExtensions.badRequest(res, "No rule_id provided");
    }
    
    const ruleIdValue = Number(ruleId);

    if (Number.isNaN(ruleId) || ruleIdValue < 1) {
        return ResponseExtensions.badRequest(res, "Invalid rule_id provided");
    }

    // TODO

    return ResponseExtensions.noContent(res);
};

export { newRule as new, get, getAll, deleteRule as delete }