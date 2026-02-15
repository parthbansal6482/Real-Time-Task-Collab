import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/**
 * Global error handler — last middleware in the Express chain.
 * Converts known errors to consistent JSON responses.
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Already an ApiError — use its status code
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
        });
        return;
    }

    // Prisma known errors
    const errAny = err as unknown as Record<string, unknown>;
    if (errAny.code === 'P2002') {
        res.status(409).json({
            success: false,
            message: 'A record with that value already exists',
        });
        return;
    }

    if (errAny.code === 'P2025') {
        res.status(404).json({
            success: false,
            message: 'Record not found',
        });
        return;
    }

    // Unexpected error
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(env.NODE_ENV === 'development' ? { error: err.message, stack: err.stack } : {}),
    });
};
