import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as activityService from '../services/activity.service';
import { AuthRequest } from '../types/express.d';

/**
 * GET /api/boards/:boardId/activities
 */
export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const result = await activityService.getActivitiesByBoard(boardId, page, limit);
    ApiResponse.success(res, result);
});
