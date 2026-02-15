/** JWT token payload */
export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

/** Shape returned to clients (never includes passwordHash) */
export interface SafeUser {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
}
