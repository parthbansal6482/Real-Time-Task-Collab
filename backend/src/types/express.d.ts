import { Request } from 'express';

/**
 * Express request with authenticated user attached.
 * Use this instead of raw Request in controllers/middleware
 * to get proper typing for req.user.
 */
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}
