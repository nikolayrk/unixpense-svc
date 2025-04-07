import rateLimit, { RateLimitExceededEventHandler } from "express-rate-limit";

export const limiter = (handler: RateLimitExceededEventHandler) => rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
    handler: handler
});