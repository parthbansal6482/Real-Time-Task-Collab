import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as taskService from '../services/task.service';
import * as boardService from '../services/board.service';
import * as activityService from '../services/activity.service';
import { ApiError } from '../utils/ApiError';
import { getIO } from '../config/socket';
import { AuthRequest } from '../types/express.d';

/**
 * GET /api/lists/:listId/tasks
 */
export const getTasksByList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const listId = req.params.listId as string;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const result = await taskService.getTasksByList(listId, page, limit);
    ApiResponse.success(res, result);
});

/**
 * POST /api/lists/:listId/tasks
 */
export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const listId = req.params.listId as string;
    const { cid, ...taskData } = req.body;

    const result = await taskService.createTask(listId, userId, taskData);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'created',
        entityType: 'task',
        entityId: result.task.id,
        metadata: { title: result.task.title, listId },
    });

    getIO().to(`board:${result.boardId}`).emit('task:created', {
        task: result.task,
        cid // Echo back the client-side temporary ID for deduplication
    });

    ApiResponse.created(res, { task: result.task, cid }, 'Task created successfully');
});

/**
 * GET /api/tasks/:taskId
 */
export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const taskId = req.params.taskId as string;
    const result = await taskService.getTask(taskId);
    ApiResponse.success(res, result);
});

/**
 * PUT /api/tasks/:taskId
 */
export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;

    const { task: existingTask } = await taskService.getTask(taskId);
    const { board: existingBoard } = await boardService.getBoard(existingTask.list.boardId);

    const isCreator = existingTask.createdById === userId;
    const isOwner = existingBoard.ownerId === userId;

    // Check if the update is only a status change
    const updateFields = Object.keys(req.body);
    const isStatusOnly = updateFields.length === 1 && updateFields[0] === 'status';

    if (!isCreator && !isOwner && !isStatusOnly) {
        throw ApiError.forbidden('Only the task creator or board owner can perform this update');
    }

    const result = await taskService.updateTask(taskId, req.body);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'updated',
        entityType: 'task',
        entityId: result.task.id,
        metadata: req.body,
    });

    getIO().to(`board:${result.boardId}`).emit('task:updated', { task: result.task });

    ApiResponse.success(res, { task: result.task }, 'Task updated successfully');
});

/**
 * DELETE /api/tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;

    const { task: existingTask } = await taskService.getTask(taskId);
    const { board: existingBoard } = await boardService.getBoard(existingTask.list.boardId);

    const isCreator = existingTask.createdById === userId;
    const isOwner = existingBoard.ownerId === userId;

    if (!isCreator && !isOwner) {
        throw ApiError.forbidden('Only the task creator or board owner can delete this task');
    }

    const result = await taskService.deleteTask(taskId);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'deleted',
        entityType: 'task',
        entityId: taskId,
        metadata: { taskId, listId: result.listId },
    });

    getIO().to(`board:${result.boardId}`).emit('task:deleted', {
        taskId,
        listId: result.listId,
    });

    ApiResponse.success(res, {}, 'Task deleted successfully');
});

/**
 * PUT /api/tasks/:taskId/move
 */
export const moveTask = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;
    const { listId, position } = req.body;

    const { task: existingTask } = await taskService.getTask(taskId);
    const { board: existingBoard } = await boardService.getBoard(existingTask.list.boardId);

    if (existingBoard.ownerId !== userId) {
        throw ApiError.forbidden('Only the board owner can move tasks across lists');
    }

    const result = await taskService.moveTask(taskId, listId, position);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'moved',
        entityType: 'task',
        entityId: taskId,
        metadata: {
            oldListId: result.oldListId,
            newListId: listId,
            newPosition: position,
        },
    });

    getIO().to(`board:${result.boardId}`).emit('task:moved', {
        taskId,
        oldListId: result.oldListId,
        newListId: listId,
        newPosition: position,
        task: result.task,
    });

    ApiResponse.success(res, { task: result.task }, 'Task moved successfully');
});

/**
 * POST /api/tasks/:taskId/assign
 */
export const assignUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;
    const assigneeId = req.body.userId as string;

    const { task: existingTask } = await taskService.getTask(taskId);
    const { board: existingBoard } = await boardService.getBoard(existingTask.list.boardId);

    const isCreator = existingTask.createdById === userId;
    const isOwner = existingBoard.ownerId === userId;

    if (!isCreator && !isOwner) {
        throw ApiError.forbidden('Only the task creator or board owner can manage assignees');
    }

    const result = await taskService.assignUser(taskId, assigneeId);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'assigned',
        entityType: 'task',
        entityId: taskId,
        metadata: { assignedUserId: assigneeId },
    });

    getIO().to(`board:${result.boardId}`).emit('task:assigned', {
        taskId,
        userId: assigneeId,
        assignment: result.assignment,
    });

    ApiResponse.created(res, { assignment: result.assignment }, 'User assigned successfully');
});

/**
 * DELETE /api/tasks/:taskId/assign/:userId
 */
export const unassignUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const taskId = req.params.taskId as string;
    const targetUserId = req.params.userId as string;

    const { task: existingTask } = await taskService.getTask(taskId);
    const { board: existingBoard } = await boardService.getBoard(existingTask.list.boardId);

    const isCreator = existingTask.createdById === userId;
    const isOwner = existingBoard.ownerId === userId;

    if (!isCreator && !isOwner) {
        throw ApiError.forbidden('Only the task creator or board owner can manage assignees');
    }

    const result = await taskService.unassignUser(taskId, targetUserId);

    await activityService.logActivity({
        boardId: result.boardId,
        userId,
        actionType: 'unassigned',
        entityType: 'task',
        entityId: taskId,
        metadata: { unassignedUserId: targetUserId },
    });

    getIO().to(`board:${result.boardId}`).emit('task:unassigned', {
        taskId,
        userId: targetUserId,
    });

    ApiResponse.success(res, {}, 'User unassigned successfully');
});
