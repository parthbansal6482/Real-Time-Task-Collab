import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as commentService from '../services/comment.service';
import * as activityService from '../services/activity.service';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types/express.d';

/**
 * Handle POST /tasks/:taskId/comments
 */
export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;
    const { content } = req.body;

    const result = await commentService.createComment(taskId, userId, content);

    // Log activity
    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'comment_added',
        entityType: 'task',
        entityId: taskId,
        metadata: {
            commentSnippet: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        }
    });

    // Emit event to board room for real-time synchronization
    getIO().to(`board:${result.boardId}`).emit('comment:added', {
        comment: result.comment,
        taskId
    });

    ApiResponse.created(res, { comment: result.comment }, 'Comment added successfully');
});

/**
 * Handle GET /tasks/:taskId/comments
 */
export const getComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const taskId = req.params.taskId as string;
    const result = await commentService.getCommentsByTask(taskId);
    ApiResponse.success(res, result);
});
