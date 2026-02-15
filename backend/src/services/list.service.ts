import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

/**
 * Get all lists for a board (ordered by position), including their tasks.
 */
export async function getListsByBoard(boardId: string) {
    const lists = await prisma.list.findMany({
        where: { boardId },
        orderBy: { position: 'asc' },
        include: {
            tasks: {
                orderBy: { position: 'asc' },
                include: {
                    createdBy: { select: { id: true, username: true } },
                    assignments: {
                        include: { user: { select: { id: true, username: true, email: true } } },
                    },
                },
            },
        },
    });

    return { lists };
}

/**
 * Create a new list within a board.
 * If no position provided, append at the end.
 */
export async function createList(boardId: string, name: string, position?: number) {
    // Determine position
    let pos = position;
    if (pos === undefined) {
        const maxList = await prisma.list.findFirst({
            where: { boardId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        pos = (maxList?.position ?? -1) + 1;
    } else {
        // Shift existing lists at or after this position
        await prisma.list.updateMany({
            where: { boardId, position: { gte: pos } },
            data: { position: { increment: 1 } },
        });
    }

    const list = await prisma.list.create({
        data: { name, boardId, position: pos },
        include: {
            tasks: {
                orderBy: { position: 'asc' },
                include: {
                    createdBy: { select: { id: true, username: true } },
                    assignments: {
                        include: { user: { select: { id: true, username: true, email: true } } },
                    },
                },
            },
        },
    });

    return { list };
}

/**
 * Update a list's name or position.
 * Position changes re-order sibling lists atomically.
 */
export async function updateList(listId: string, data: { name?: string; position?: number }) {
    const existing = await prisma.list.findUnique({ where: { id: listId } });
    if (!existing) throw ApiError.notFound('List not found');

    // Handle position change
    if (data.position !== undefined && data.position !== existing.position) {
        const newPos = data.position;
        const oldPos = existing.position;

        if (newPos < oldPos) {
            await prisma.list.updateMany({
                where: {
                    boardId: existing.boardId,
                    position: { gte: newPos, lt: oldPos },
                    id: { not: listId },
                },
                data: { position: { increment: 1 } },
            });
        } else {
            await prisma.list.updateMany({
                where: {
                    boardId: existing.boardId,
                    position: { gt: oldPos, lte: newPos },
                    id: { not: listId },
                },
                data: { position: { decrement: 1 } },
            });
        }
    }

    const list = await prisma.list.update({
        where: { id: listId },
        data,
    });

    return { list };
}

/**
 * Delete a list and re-compact sibling positions.
 */
export async function deleteList(listId: string) {
    const list = await prisma.list.findUnique({ where: { id: listId } });
    if (!list) throw ApiError.notFound('List not found');

    await prisma.$transaction([
        prisma.list.delete({ where: { id: listId } }),
        prisma.list.updateMany({
            where: {
                boardId: list.boardId,
                position: { gt: list.position },
            },
            data: { position: { decrement: 1 } },
        }),
    ]);

    return { boardId: list.boardId };
}
