import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler to ensure rejected promises
 * are forwarded to the global error middleware.
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
