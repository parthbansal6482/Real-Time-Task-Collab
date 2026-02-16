import { z } from 'zod';

/**
 * Reusable Zod schemas for request validation across all routes.
 */

// ── Auth ────────────────────────────────────────────────────────────

export const signupSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    username: z
        .string()
        .min(2, 'Username must be at least 2 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_ ]+$/, 'Username can only contain letters, numbers, underscores, and spaces'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    username: z
        .string()
        .min(2, 'Username must be at least 2 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_ ]+$/, 'Username can only contain letters, numbers, underscores, and spaces'),
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ── Board ───────────────────────────────────────────────────────────

export const createBoardSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    memberIds: z.array(z.string().uuid()).optional(),
});

export const updateBoardSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// ── List ────────────────────────────────────────────────────────────

export const createListSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    position: z.number().int().min(0).optional(),
});

export const updateListSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    position: z.number().int().min(0).optional(),
});

// ── Task ────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    position: z.number().int().min(0).optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    position: z.number().int().min(0).optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['active', 'completed']).optional(),
});

export const moveTaskSchema = z.object({
    listId: z.string().uuid('Invalid list ID'),
    position: z.number().int().min(0),
});

export const assignTaskSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
});

export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required').max(1000),
});

// ── Pagination & Search ─────────────────────────────────────────────

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
    q: z.string().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Params ──────────────────────────────────────────────────────────

export const uuidParamSchema = z.object({
    id: z.string().uuid(),
});

export const boardIdParamSchema = z.object({
    boardId: z.string().uuid(),
});

export const listIdParamSchema = z.object({
    listId: z.string().uuid(),
});

export const taskIdParamSchema = z.object({
    taskId: z.string().uuid(),
});

export const memberParamsSchema = z.object({
    boardId: z.string().uuid(),
    userId: z.string().uuid(),
});

export const addMemberSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
});
