import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types/express.d';

/**
 * Middleware factory that verifies the authenticated user is a member of the board
 * referenced by `:boardId` in the route params (or inferred from a list/task).
 */
export const requireBoardAccess = (paramKey = 'boardId') => {
    return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
        const userId = req.user?.userId;
        if (!userId) throw ApiError.unauthorized();

        let boardId: string | undefined = req.params[paramKey] as string | undefined;

        // If no boardId in params, try to infer from a list or task
        if (!boardId && req.params.listId) {
            const list = await prisma.list.findUnique({
                where: { id: req.params.listId as string },
                select: { boardId: true },
            });
            if (!list) throw ApiError.notFound('List not found');
            boardId = list.boardId;
        }

        if (!boardId && req.params.taskId) {
            const task = await prisma.task.findUnique({
                where: { id: req.params.taskId as string },
                select: { list: { select: { boardId: true } } },
            });
            if (!task) throw ApiError.notFound('Task not found');
            boardId = task.list.boardId;
        }

        if (!boardId) throw ApiError.badRequest('Board ID is required');

        const membership = await prisma.boardMember.findUnique({
            where: { boardId_userId: { boardId, userId } },
        });

        if (!membership) {
            throw ApiError.forbidden('You are not a member of this board');
        }

        next();
    };
};

/**
 * Middleware that checks the user is the board owner.
 */
export const requireBoardOwner = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const userId = req.user?.userId;
    const boardId = req.params.boardId as string;
    if (!userId || !boardId) throw ApiError.badRequest();

    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { ownerId: true },
    });

    if (!board) throw ApiError.notFound('Board not found');
    if (board.ownerId !== userId) {
        throw ApiError.forbidden('Only the board owner can perform this action');
    }

    next();
};
