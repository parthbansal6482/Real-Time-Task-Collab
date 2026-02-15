import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as searchService from '../services/search.service';
import { AuthRequest } from '../types/express.d';

/**
 * GET /api/boards/search?q=query&page=1&limit=20
 */
export const searchBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const q = req.query.q as string;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const result = await searchService.searchBoards(userId, q, page, limit);
    ApiResponse.success(res, result);
});

/**
 * GET /api/boards/:boardId/search?q=query
 */
export const searchTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    const q = req.query.q as string;

    if (!q || q.trim().length === 0) {
        ApiResponse.success(res, { tasks: [] });
        return;
    }

    const result = await searchService.searchTasksInBoard(boardId, q);
    ApiResponse.success(res, result);
});
