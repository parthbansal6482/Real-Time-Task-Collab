import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

/**
 * Create a new comment on a task.
 */
export async function createComment(taskId: string, userId: string, content: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, list: { select: { boardId: true } } }
    });

    if (!task) throw ApiError.notFound('Task not found');

    const comment = await prisma.comment.create({
        data: {
            taskId,
            userId,
            content
        },
        include: {
            user: { select: { id: true, username: true, email: true } }
        }
    });

    return { comment, boardId: task.list.boardId };
}

/**
 * Get all comments for a task.
 */
export async function getCommentsByTask(taskId: string) {
    const comments = await prisma.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: 'asc' },
        include: {
            user: { select: { id: true, username: true, email: true } }
        }
    });

    return { comments };
}
