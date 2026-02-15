import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as listService from '../services/list.service';
import * as activityService from '../services/activity.service';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types/express.d';

/**
 * GET /api/boards/:boardId/lists
 */
export const getListsByBoard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const boardId = req.params.boardId as string;
    const result = await listService.getListsByBoard(boardId);
    ApiResponse.success(res, result);
});

/**
 * POST /api/boards/:boardId/lists
 */
export const createList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const boardId = req.params.boardId as string;
    const { name, position } = req.body;

    const result = await listService.createList(boardId, name, position);

    await activityService.logActivity({
        boardId,
        userId,
        actionType: 'created',
        entityType: 'list',
        entityId: result.list.id,
        metadata: { name },
    });

    getIO().to(`board:${boardId}`).emit('list:created', { list: result.list });

    ApiResponse.created(res, result, 'List created successfully');
});

/**
 * PUT /api/lists/:listId
 */
export const updateList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const listId = req.params.listId as string;
    const result = await listService.updateList(listId, req.body);

    const boardId = result.list.boardId;
    await activityService.logActivity({
        boardId,
        userId,
        actionType: 'updated',
        entityType: 'list',
        entityId: result.list.id,
        metadata: req.body,
    });

    getIO().to(`board:${boardId}`).emit('list:updated', { list: result.list });

    ApiResponse.success(res, result, 'List updated successfully');
});

/**
 * DELETE /api/lists/:listId
 */
export const deleteList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const listId = req.params.listId as string;
    const result = await listService.deleteList(listId);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'deleted',
        entityType: 'list',
        entityId: listId,
        metadata: { listId },
    });

    getIO().to(`board:${result.boardId}`).emit('list:deleted', {
        listId,
        boardId: result.boardId,
    });

    ApiResponse.success(res, {}, 'List deleted successfully');
});
