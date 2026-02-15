import { Response } from 'express';

/**
 * Standardized API response helper — ensures consistent JSON shape across all endpoints.
 */
export class ApiResponse {
    /**
     * Send a success response.
     * @param res Express response object
     * @param data Response payload
     * @param message Optional success message
     * @param statusCode HTTP status code (default 200)
     */
    static success<T>(res: Response, data: T, message?: string, statusCode = 200): void {
        res.status(statusCode).json({
            success: true,
            message,
            ...data as object,
        });
    }

    /**
     * Send a created (201) response.
     */
    static created<T>(res: Response, data: T, message = 'Created successfully'): void {
        ApiResponse.success(res, data, message, 201);
    }

    /**
     * Send an error response.
     */
    static error(res: Response, statusCode: number, message: string, errors?: unknown): void {
        res.status(statusCode).json({
            success: false,
            message,
            ...(errors ? { errors } : {}),
        });
    }
}
