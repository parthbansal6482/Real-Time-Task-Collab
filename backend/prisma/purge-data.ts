import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Purging database data...');

    try {
        // Delete in order of dependencies
        await prisma.activity.deleteMany();
        await prisma.taskAssignment.deleteMany();
        await prisma.task.deleteMany();
        await prisma.list.deleteMany();
        await prisma.boardMember.deleteMany();
        await prisma.board.deleteMany();
        await prisma.user.deleteMany();

        console.log('✅ Database purged successfully.');
    } catch (error) {
        console.error('❌ Error purging database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
