import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed the database with demo data:
 * - 2 demo users
 * - 3 boards with lists and tasks
 * - Task assignments and activity log entries
 */
async function main() {
    console.log('🌱 Seeding database...\n');

    // ── Cleanup ────────────────────────────────────────────────────
    console.log('  Cleaning up database...');
    await prisma.activity.deleteMany();
    await prisma.taskAssignment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.list.deleteMany();
    await prisma.boardMember.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    console.log('  ✓ Database cleared');

    // ── Users ───────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Duality@2026', 12);

    const usersData = [
        { email: 'sarah@example.com', username: 'Sarah Chen' },
        { email: 'alex@example.com', username: 'Alex Rivera' },
        { email: 'jordan@example.com', username: 'Jordan Smith' },
        { email: 'emma@example.com', username: 'Emma Wilson' },
        { email: 'david@example.com', username: 'David Kim' },
    ];

    const users: any[] = [];

    for (const userData of usersData) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: { passwordHash },
            create: {
                ...userData,
                passwordHash,
            },
        });
        users.push(user);
    }

    const [sarah, alex, jordan, emma, david] = users;

    console.log('  ✓ 5 Users created');

    // ── Board 1: Product Launch ─────────────────────────────────────
    const board1 = await prisma.board.create({
        data: {
            name: 'Product Launch Q1',
            description: 'Q1 product launch planning and execution',
            color: '#6366f1',
            ownerId: sarah.id,
            members: {
                createMany: {
                    data: [
                        { userId: sarah.id, role: 'owner' },
                        { userId: alex.id, role: 'member' },
                        { userId: jordan.id, role: 'member' },
                    ],
                },
            },
        },
    });

    const todoList = await prisma.list.create({
        data: { name: 'To Do', boardId: board1.id, position: 0 },
    });
    const inProgressList = await prisma.list.create({
        data: { name: 'In Progress', boardId: board1.id, position: 1 },
    });
    const reviewList = await prisma.list.create({
        data: { name: 'Review', boardId: board1.id, position: 2 },
    });
    const doneList = await prisma.list.create({
        data: { name: 'Done', boardId: board1.id, position: 3 },
    });

    // Tasks for Board 1
    const task1 = await prisma.task.create({
        data: {
            title: 'Design landing page mockup',
            description: 'Create high-fidelity mockup for the new landing page.',
            listId: todoList.id,
            position: 0,
            priority: 'high',
            createdById: alex.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Write API documentation',
            description: 'Document all REST endpoints with request/response examples.',
            listId: todoList.id,
            position: 1,
            priority: 'medium',
            createdById: sarah.id,
            dueDate: new Date(Date.now() + 5 * 86400000),
        },
    });

    await prisma.task.create({
        data: {
            title: 'Set up CI/CD pipeline',
            description: 'Configure GitHub Actions for automated testing and deployment.',
            listId: todoList.id,
            position: 2,
            priority: 'high',
            createdById: sarah.id,
            dueDate: new Date(Date.now() + 2 * 86400000),
        },
    });

    const task4 = await prisma.task.create({
        data: {
            title: 'Implement user authentication',
            description: 'Add JWT-based authentication with login, signup, and password reset.',
            listId: inProgressList.id,
            position: 0,
            priority: 'high',
            createdById: sarah.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Build notification system',
            description: 'Real-time notifications for task assignments, mentions, and due dates.',
            listId: inProgressList.id,
            position: 1,
            priority: 'medium',
            createdById: sarah.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Review PR: Dashboard redesign',
            description: 'Review the pull request for the new dashboard layout.',
            listId: reviewList.id,
            position: 0,
            priority: 'medium',
            createdById: alex.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Database schema migration',
            description: 'Migrate from MongoDB to PostgreSQL schema.',
            listId: doneList.id,
            position: 0,
            priority: 'low',
            status: 'completed',
            createdById: sarah.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Set up project repository',
            description: 'Initialize project with Vite, React, TypeScript.',
            listId: doneList.id,
            position: 1,
            priority: 'low',
            status: 'completed',
            createdById: sarah.id,
        },
    });

    // Task assignments
    await prisma.taskAssignment.createMany({
        data: [
            { taskId: task1.id, userId: alex.id },
            { taskId: task4.id, userId: sarah.id },
            { taskId: task4.id, userId: alex.id },
        ],
    });

    console.log('  ✓ Board 1 with 4 lists and 8 tasks created');

    // ── Board 2: Engineering Sprint ─────────────────────────────────
    const board2 = await prisma.board.create({
        data: {
            name: 'Engineering Sprint',
            description: 'Current sprint tasks and bugs',
            color: '#8b5cf6',
            ownerId: sarah.id,
            members: {
                create: { userId: sarah.id, role: 'owner' },
            },
        },
    });

    const backlog = await prisma.list.create({
        data: { name: 'Backlog', boardId: board2.id, position: 0 },
    });
    const sprint = await prisma.list.create({
        data: { name: 'In Progress', boardId: board2.id, position: 1 },
    });
    const done2 = await prisma.list.create({
        data: { name: 'Done', boardId: board2.id, position: 2 },
    });

    await prisma.task.create({
        data: {
            title: 'Performance audit',
            description: 'Run Lighthouse audit and fix key issues.',
            listId: backlog.id,
            position: 0,
            priority: 'medium',
            createdById: sarah.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Fix drag-and-drop bug',
            description: 'Tasks sometimes snap back after dropping.',
            listId: sprint.id,
            position: 0,
            priority: 'high',
            createdById: sarah.id,
        },
    });

    await prisma.task.create({
        data: {
            title: 'Responsive sidebar',
            description: 'Make sidebar collapsible and mobile-friendly.',
            listId: done2.id,
            position: 0,
            priority: 'low',
            status: 'completed',
            createdById: sarah.id,
        },
    });

    console.log('  ✓ Board 2 with 3 lists and 3 tasks created');

    // ── Board 3: Design System ──────────────────────────────────────
    const board3 = await prisma.board.create({
        data: {
            name: 'Design System',
            description: 'Component library and design tokens',
            color: '#ec4899',
            ownerId: alex.id,
            members: {
                createMany: {
                    data: [
                        { userId: alex.id, role: 'owner' },
                        { userId: sarah.id, role: 'member' },
                    ],
                },
            },
        },
    });

    const components = await prisma.list.create({
        data: { name: 'Components', boardId: board3.id, position: 0 },
    });

    await prisma.task.create({
        data: {
            title: 'Button component',
            description: 'Primary, secondary, and ghost button variants.',
            listId: components.id,
            position: 0,
            priority: 'medium',
            createdById: alex.id,
        },
    });

    console.log('  ✓ Board 3 with 1 list and 1 task created');

    // ── Activity log ────────────────────────────────────────────────
    await prisma.activity.createMany({
        data: [
            {
                boardId: board1.id,
                userId: sarah.id,
                actionType: 'created',
                entityType: 'board',
                entityId: board1.id,
                metadata: { name: 'Product Launch Q1' },
            },
            {
                boardId: board1.id,
                userId: alex.id,
                actionType: 'created',
                entityType: 'task',
                entityId: task1.id,
                metadata: { title: 'Design landing page mockup' },
            },
            {
                boardId: board1.id,
                userId: sarah.id,
                actionType: 'assigned',
                entityType: 'task',
                entityId: task4.id,
                metadata: { title: 'Implement user authentication' },
            },
        ],
    });

    console.log('  ✓ Activity log entries created');
    console.log('\n✅ Seed complete!\n');
    console.log('  Demo credentials (all users use the same password):');
    console.log('    Email:    [any of the 5]@example.com');
    console.log('    Password: Duality@2026\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
