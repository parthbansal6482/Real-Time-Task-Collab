/**
 * Custom API error class — used throughout the app for controlled error responses.
 * Operational errors (isOperational=true) are safe to show to clients.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, ApiError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    /** 400 Bad Request */
    static badRequest(message = 'Bad request'): ApiError {
        return new ApiError(400, message);
    }

    /** 401 Unauthorized */
    static unauthorized(message = 'Unauthorized'): ApiError {
        return new ApiError(401, message);
    }

    /** 403 Forbidden */
    static forbidden(message = 'Forbidden'): ApiError {
        return new ApiError(403, message);
    }

    /** 404 Not Found */
    static notFound(message = 'Resource not found'): ApiError {
        return new ApiError(404, message);
    }

    /** 409 Conflict */
    static conflict(message = 'Conflict'): ApiError {
        return new ApiError(409, message);
    }

    /** 500 Internal Server Error */
    static internal(message = 'Internal server error'): ApiError {
        return new ApiError(500, message, false);
    }
}
