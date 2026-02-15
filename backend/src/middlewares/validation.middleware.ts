import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware factory — validates `req.body` against a Zod schema.
 */
export const validateBody = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                throw new ApiError(400, messages.join('; '));
            }
            throw err;
        }
    };
};

/**
 * Middleware factory — validates `req.query` against a Zod schema.
 */
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as Record<string, string>;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                throw new ApiError(400, messages.join('; '));
            }
            throw err;
        }
    };
};

/**
 * Middleware factory — validates `req.params` against a Zod schema.
 */
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as Record<string, string>;
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                throw new ApiError(400, messages.join('; '));
            }
            throw err;
        }
    };
};
