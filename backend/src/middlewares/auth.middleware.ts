import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types/user.types';
import { AuthRequest } from '../types/express.d';

/**
 * Middleware to verify JWT from Authorization header.
 * Attaches `req.user = { userId, email }` on success.
 */
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = { userId: decoded.userId, email: decoded.email };
        next();
    } catch {
        throw ApiError.unauthorized('Invalid or expired token');
    }
};
