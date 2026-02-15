import { prisma } from '../config/database';
import { paginate, sanitiseSearch } from '../utils/helpers';

/**
 * Search tasks within a specific board by title/description.
 */
export async function searchTasksInBoard(boardId: string, query: string) {
    const sanitised = sanitiseSearch(query);

    const tasks = await prisma.task.findMany({
        where: {
            list: { boardId },
            OR: [
                { title: { contains: sanitised, mode: 'insensitive' } },
                { description: { contains: sanitised, mode: 'insensitive' } },
            ],
        },
        include: {
            list: { select: { id: true, name: true } },
            createdBy: { select: { id: true, username: true } },
            assignments: {
                include: { user: { select: { id: true, username: true } } },
            },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
    });

    return { tasks };
}

/**
 * Search boards the user can access.
 */
export async function searchBoards(
    userId: string,
    query: string,
    page: number,
    limit: number
) {
    const sanitised = sanitiseSearch(query);

    const where = {
        members: { some: { userId } },
        OR: [
            { name: { contains: sanitised, mode: 'insensitive' as const } },
            { description: { contains: sanitised, mode: 'insensitive' as const } },
        ],
    };

    const [boards, total] = await Promise.all([
        prisma.board.findMany({
            where,
            include: {
                owner: { select: { id: true, username: true } },
                _count: { select: { lists: true } },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.board.count({ where }),
    ]);

    return { boards, pagination: paginate(total, page, limit) };
}
