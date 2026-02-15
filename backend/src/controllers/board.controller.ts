import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as boardService from '../services/board.service';
import * as activityService from '../services/activity.service';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types/express.d';

/**
 * GET /api/boards
 */
export const listBoards = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const search = (req.query.search as string) || undefined;

    const result = await boardService.listBoards(userId, page, limit, search);
    ApiResponse.success(res, result);
});

/**
 * POST /api/boards
 */
export const createBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { name, description, color, memberIds } = req.body;

    const result = await boardService.createBoard(userId, name, description, color, memberIds);

    await activityService.logActivity({
        boardId: result.board.id,
        userId,
        actionType: 'created',
        entityType: 'board',
        entityId: result.board.id,
        metadata: { name },
    });

    ApiResponse.created(res, result, 'Board created successfully');
});

/**
 * GET /api/boards/:boardId
 */
export const getBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    const result = await boardService.getBoard(boardId);
    ApiResponse.success(res, result);
});

/**
 * PUT /api/boards/:boardId
 */
export const updateBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const boardId = req.params.boardId as string;
    const result = await boardService.updateBoard(boardId, req.body);

    await activityService.logActivity({
        boardId,
        userId,
        actionType: 'updated',
        entityType: 'board',
        entityId: boardId,
        metadata: req.body,
    });

    getIO().to(`board:${boardId}`).emit('board:updated', { board: result.board });

    ApiResponse.success(res, result, 'Board updated successfully');
});

/**
 * DELETE /api/boards/:boardId
 */
export const deleteBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    await boardService.deleteBoard(boardId);

    getIO().to(`board:${boardId}`).emit('board:deleted', { boardId });

    ApiResponse.success(res, {}, 'Board deleted successfully');
});

/**
 * GET /api/boards/:boardId/members
 */
export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    const result = await boardService.getMembers(boardId);
    ApiResponse.success(res, result);
});

/**
 * POST /api/boards/:boardId/members
 */
export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const boardId = req.params.boardId as string;
    const result = await boardService.addMember(boardId, req.body.userId);

    await activityService.logActivity({
        boardId,
        userId,
        actionType: 'added',
        entityType: 'member',
        entityId: req.body.userId as string,
        metadata: { addedUserId: req.body.userId },
    });

    getIO().to(`board:${boardId}`).emit('member:added', {
        member: result.member,
        boardId,
    });

    ApiResponse.created(res, result, 'Member added successfully');
});

/**
 * DELETE /api/boards/:boardId/members/:userId
 */
export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const boardId = req.params.boardId as string;
    const targetUserId = req.params.userId as string;

    await boardService.removeMember(boardId, targetUserId);

    await activityService.logActivity({
        boardId,
        userId,
        actionType: 'removed',
        entityType: 'member',
        entityId: targetUserId,
        metadata: { removedUserId: targetUserId },
    });

    getIO().to(`board:${boardId}`).emit('member:removed', {
        userId: targetUserId,
        boardId,
    });

    ApiResponse.success(res, {}, 'Member removed successfully');
});
