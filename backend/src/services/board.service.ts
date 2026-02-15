import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { paginate, sanitiseSearch } from '../utils/helpers';

/**
 * List all boards the user is a member of, with pagination and optional search.
 */
export async function listBoards(
    userId: string,
    page: number,
    limit: number,
    search?: string
) {
    const where: Record<string, unknown> = {
        members: { some: { userId } },
    };

    if (search) {
        const sanitised = sanitiseSearch(search);
        where.OR = [
            { name: { contains: sanitised, mode: 'insensitive' } },
            { description: { contains: sanitised, mode: 'insensitive' } },
        ];
    }

    const [boards, total] = await Promise.all([
        prisma.board.findMany({
            where,
            include: {
                owner: { select: { id: true, username: true, email: true } },
                members: { include: { user: { select: { id: true, username: true, email: true } } } },
                _count: { select: { lists: true } },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.board.count({ where }),
    ]);

    // Enrich with task count
    const enriched = await Promise.all(
        boards.map(async (board) => {
            const taskCount = await prisma.task.count({
                where: { list: { boardId: board.id } },
            });
            return { ...board, taskCount };
        })
    );

    return { boards: enriched, pagination: paginate(total, page, limit) };
}

/**
 * Get a single board with all lists, tasks, and members.
 */
export async function getBoard(boardId: string) {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
            owner: { select: { id: true, username: true, email: true } },
            members: {
                include: { user: { select: { id: true, username: true, email: true } } },
            },
            lists: {
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
            },
        },
    });

    if (!board) throw ApiError.notFound('Board not found');
    return { board };
}

/**
 * Create a new board and add the creator as owner member.
 */
export async function createBoard(
    userId: string,
    name: string,
    description?: string,
    color?: string,
    memberIds?: string[]
) {
    // Filter out owner from memberIds to avoid duplicate creation
    const additionalMembers = (memberIds || [])
        .filter(id => id !== userId)
        .map(id => ({ userId: id, role: 'member' }));

    const board = await prisma.board.create({
        data: {
            name,
            description,
            color: color || '#6366f1',
            ownerId: userId,
            members: {
                create: [
                    { userId, role: 'owner' },
                    ...additionalMembers
                ],
            },
        },
        include: {
            owner: { select: { id: true, username: true, email: true } },
            members: { include: { user: { select: { id: true, username: true, email: true } } } },
        },
    });

    return { board };
}

/**
 * Update board name/description.
 */
export async function updateBoard(
    boardId: string,
    data: { name?: string; description?: string; color?: string }
) {
    const board = await prisma.board.update({
        where: { id: boardId },
        data,
        include: {
            owner: { select: { id: true, username: true, email: true } },
            members: { include: { user: { select: { id: true, username: true, email: true } } } },
        },
    });

    return { board };
}

/**
 * Delete a board and all related data (cascades via Prisma).
 */
export async function deleteBoard(boardId: string) {
    await prisma.board.delete({ where: { id: boardId } });
}

/**
 * Add a user to a board as a member.
 */
export async function addMember(boardId: string, userId: string) {
    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    // Check not already a member
    const existing = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId } },
    });
    if (existing) throw ApiError.conflict('User is already a member of this board');

    const member = await prisma.boardMember.create({
        data: { boardId, userId, role: 'member' },
        include: { user: { select: { id: true, username: true, email: true } } },
    });

    return { member };
}

/**
 * Remove a user from a board.
 */
export async function removeMember(boardId: string, userId: string) {
    // Prevent removing the owner
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw ApiError.notFound('Board not found');
    if (board.ownerId === userId) throw ApiError.badRequest('Cannot remove the board owner');

    await prisma.boardMember.delete({
        where: { boardId_userId: { boardId, userId } },
    });
}

/**
 * Get all members of a board.
 */
export async function getMembers(boardId: string) {
    const members = await prisma.boardMember.findMany({
        where: { boardId },
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
    });

    return { members };
}
