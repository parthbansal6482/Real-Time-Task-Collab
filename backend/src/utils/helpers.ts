/**
 * Utility helpers used across the application.
 */

/**
 * Calculate pagination metadata from total count and page/limit params.
 */
export function paginate(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Sanitise a search query for safe use in SQL ILIKE.
 */
export function sanitiseSearch(query: string): string {
    return query.replace(/[%_\\]/g, '\\$&');
}
