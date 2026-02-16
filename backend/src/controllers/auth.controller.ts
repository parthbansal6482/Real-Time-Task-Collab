import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types/express.d';

/**
 * POST /api/auth/signup
 */
export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, username } = req.body;
    const result = await authService.signup(email, password, username);
    ApiResponse.created(res, result, 'User registered successfully');
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    ApiResponse.success(res, result, 'Login successful');
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // JWT is stateless — client simply discards the token.
    ApiResponse.success(res, {}, 'Logged out successfully');
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await authService.getMe(userId);
    ApiResponse.success(res, result);
});

/**
 * GET /api/auth/users
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await authService.listUsers(userId);
    ApiResponse.success(res, result);
});

/**
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { username } = req.body;
    const result = await authService.updateProfile(userId, username);
    ApiResponse.success(res, result, 'Profile updated successfully');
});

/**
 * PUT /api/auth/password
 */
export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    await authService.updatePassword(userId, currentPassword, newPassword);
    ApiResponse.success(res, {}, 'Password changed successfully');
});
