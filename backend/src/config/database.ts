import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma client singleton — avoids creating multiple connections in development
 * when nodemon restarts the server.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
