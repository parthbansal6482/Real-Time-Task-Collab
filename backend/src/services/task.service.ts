import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { paginate } from '../utils/helpers';

/**
 * Get tasks in a list with pagination.
 */
export async function getTasksByList(listId: string, page: number, limit: number) {
    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where: { listId },
            orderBy: { position: 'asc' },
            include: {
                createdBy: { select: { id: true, username: true } },
                assignments: {
                    include: { user: { select: { id: true, username: true, email: true } } },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.task.count({ where: { listId } }),
    ]);

    return { tasks, pagination: paginate(total, page, limit) };
}

/**
 * Get a single task by ID.
 */
export async function getTask(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            list: { select: { id: true, name: true, boardId: true } },
            createdBy: { select: { id: true, username: true, email: true } },
            assignments: {
                include: { user: { select: { id: true, username: true, email: true } } },
            },
        },
    });

    if (!task) throw ApiError.notFound('Task not found');
    return { task };
}

/**
 * Create a task within a list.
 */
export async function createTask(
    listId: string,
    createdById: string,
    data: {
        title: string;
        description?: string;
        position?: number;
        dueDate?: string;
        priority?: string;
    }
) {
    // Verify list exists and get boardId
    const list = await prisma.list.findUnique({
        where: { id: listId },
        select: { id: true, boardId: true },
    });
    if (!list) throw ApiError.notFound('List not found');

    // Determine position
    let position = data.position;
    if (position === undefined) {
        const maxTask = await prisma.task.findFirst({
            where: { listId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        position = (maxTask?.position ?? -1) + 1;
    } else {
        await prisma.task.updateMany({
            where: { listId, position: { gte: position } },
            data: { position: { increment: 1 } },
        });
    }

    const task = await prisma.task.create({
        data: {
            title: data.title,
            description: data.description,
            listId,
            position,
            priority: data.priority || 'medium',
            createdById,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
        include: {
            list: { select: { id: true, name: true, boardId: true } },
            createdBy: { select: { id: true, username: true } },
            assignments: {
                include: { user: { select: { id: true, username: true, email: true } } },
            },
        },
    });

    return { task, boardId: list.boardId };
}

/**
 * Update a task's fields.
 */
export async function updateTask(
    taskId: string,
    data: {
        title?: string;
        description?: string;
        position?: number;
        dueDate?: string | null;
        priority?: string;
        status?: string;
    }
) {
    const existing = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { select: { boardId: true } } },
    });
    if (!existing) throw ApiError.notFound('Task not found');

    // Handle position change within same list
    if (data.position !== undefined && data.position !== existing.position) {
        const newPos = data.position;
        const oldPos = existing.position;

        if (newPos < oldPos) {
            await prisma.task.updateMany({
                where: {
                    listId: existing.listId,
                    position: { gte: newPos, lt: oldPos },
                    id: { not: taskId },
                },
                data: { position: { increment: 1 } },
            });
        } else {
            await prisma.task.updateMany({
                where: {
                    listId: existing.listId,
                    position: { gt: oldPos, lte: newPos },
                    id: { not: taskId },
                },
                data: { position: { decrement: 1 } },
            });
        }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
            list: { select: { id: true, name: true, boardId: true } },
            createdBy: { select: { id: true, username: true } },
            assignments: {
                include: { user: { select: { id: true, username: true, email: true } } },
            },
        },
    });

    return { task, boardId: existing.list.boardId };
}

/**
 * Move a task to a different list and/or position.
 * Uses a transaction to atomically update positions.
 */
export async function moveTask(taskId: string, newListId: string, newPosition: number) {
    const existing = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { select: { boardId: true } } },
    });
    if (!existing) throw ApiError.notFound('Task not found');

    // Verify target list exists and is in the same board
    const targetList = await prisma.list.findUnique({
        where: { id: newListId },
        select: { id: true, boardId: true },
    });
    if (!targetList) throw ApiError.notFound('Target list not found');
    if (targetList.boardId !== existing.list.boardId) {
        throw ApiError.badRequest('Cannot move task to a list in a different board');
    }

    const oldListId = existing.listId;
    const oldPosition = existing.position;

    await prisma.$transaction([
        // Close the gap in the old list
        prisma.task.updateMany({
            where: {
                listId: oldListId,
                position: { gt: oldPosition },
                id: { not: taskId },
            },
            data: { position: { decrement: 1 } },
        }),
        // Make room in the new list
        prisma.task.updateMany({
            where: {
                listId: newListId,
                position: { gte: newPosition },
                id: { not: taskId },
            },
            data: { position: { increment: 1 } },
        }),
        // Move the task
        prisma.task.update({
            where: { id: taskId },
            data: { listId: newListId, position: newPosition },
        }),
    ]);

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            list: { select: { id: true, name: true, boardId: true } },
            createdBy: { select: { id: true, username: true } },
            assignments: {
                include: { user: { select: { id: true, username: true, email: true } } },
            },
        },
    });

    return { task, boardId: existing.list.boardId, oldListId };
}

/**
 * Delete a task and re-compact positions.
 */
export async function deleteTask(taskId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { select: { boardId: true } } },
    });
    if (!task) throw ApiError.notFound('Task not found');

    await prisma.$transaction([
        prisma.task.delete({ where: { id: taskId } }),
        prisma.task.updateMany({
            where: {
                listId: task.listId,
                position: { gt: task.position },
            },
            data: { position: { decrement: 1 } },
        }),
    ]);

    return { boardId: task.list.boardId, listId: task.listId };
}

/**
 * Assign a user to a task.
 */
export async function assignUser(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { select: { boardId: true } } },
    });
    if (!task) throw ApiError.notFound('Task not found');

    // Verify user is board member
    const isMember = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: task.list.boardId, userId } },
    });
    if (!isMember) throw ApiError.badRequest('User is not a member of this board');

    const assignment = await prisma.taskAssignment.create({
        data: { taskId, userId },
        include: { user: { select: { id: true, username: true, email: true } } },
    });

    return { assignment, boardId: task.list.boardId };
}

/**
 * Unassign a user from a task.
 */
export async function unassignUser(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: { select: { boardId: true } } },
    });
    if (!task) throw ApiError.notFound('Task not found');

    await prisma.taskAssignment.delete({
        where: { taskId_userId: { taskId, userId } },
    });

    return { boardId: task.list.boardId };
}
