/** Pagination query parameters (after Zod parsing) */
export interface PaginationParams {
    page: number;
    limit: number;
}

/** Standard paginated response envelope */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/** Socket.io authenticated socket */
export interface AuthenticatedSocket {
    userId: string;
    username: string;
}
