import { prisma } from '../config/database';
import { paginate } from '../utils/helpers';

/**
 * Create an activity log entry. Called by controllers after each important action.
 */
export async function logActivity(data: {
    boardId: string;
    userId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}) {
    const activity = await prisma.activity.create({
        data: {
            boardId: data.boardId,
            userId: data.userId,
            actionType: data.actionType,
            entityType: data.entityType,
            entityId: data.entityId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: data.metadata ? (JSON.parse(JSON.stringify(data.metadata)) as any) : undefined,
        },
        include: {
            user: { select: { id: true, username: true } },
        },
    });

    return activity;
}

/**
 * Fetch activity log for a board, paginated and sorted newest-first.
 */
export async function getActivitiesByBoard(boardId: string, page: number, limit: number) {
    const [activities, total] = await Promise.all([
        prisma.activity.findMany({
            where: { boardId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true } },
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.activity.count({ where: { boardId } }),
    ]);

    return { activities, pagination: paginate(total, page, limit) };
}
