import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { SafeUser, JwtPayload } from '../types/user.types';

const SALT_ROUNDS = 12;

/**
 * Generate a signed JWT for the given user.
 */
function generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { userId, email };
    const options: SignOptions = { expiresIn: env.JWT_EXPIRE as unknown as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Strip sensitive fields from a User record.
 */
function toSafeUser(user: { id: string; email: string; username: string; createdAt: Date }): SafeUser {
    return { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
}

/**
 * Register a new user.
 * @throws ApiError 409 if email or username is taken
 */
export async function signup(email: string, password: string, username: string) {
    // Check for existing user
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });

    if (existing) {
        const field = existing.email === email ? 'email' : 'username';
        throw ApiError.conflict(`A user with that ${field} already exists`);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: { email, username, passwordHash },
    });

    const token = generateToken(user.id, user.email);
    return { user: toSafeUser(user), token };
}

/**
 * Authenticate an existing user.
 * @throws ApiError 401 if credentials are invalid
 */
export async function login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    const token = generateToken(user.id, user.email);
    return { user: toSafeUser(user), token };
}

/**
 * Get user profile by ID.
 */
export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return { user: toSafeUser(user) };
}

/**
 * List all users except the current user.
 */
export async function listUsers(currentUserId: string): Promise<{ users: SafeUser[] }> {
    const users = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        orderBy: { username: 'asc' },
    });
    return { users: users.map(toSafeUser) };
}
