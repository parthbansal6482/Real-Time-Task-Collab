import { prisma } from '../src/config/database';

/**
 * Test setup — runs before each test suite.
 * Cleans the database so each test starts fresh.
 */
beforeAll(async () => {
    // Ensure Prisma is connected
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

/**
 * Helper to clean all tables between test runs.
 * Deletes in reverse dependency order.
 */
export async function cleanDatabase() {
    await prisma.$transaction([
        prisma.activity.deleteMany(),
        prisma.taskAssignment.deleteMany(),
        prisma.task.deleteMany(),
        prisma.list.deleteMany(),
        prisma.boardMember.deleteMany(),
        prisma.board.deleteMany(),
        prisma.user.deleteMany(),
    ]);
}
