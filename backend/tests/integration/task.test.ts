import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../setup';

describe('Task Endpoints', () => {
    let token: string;
    let boardId: string;
    let listId: string;

    const validUser = {
        email: 'task-test@example.com',
        password: 'Password123',
        username: 'Task Tester',
    };

    beforeEach(async () => {
        await cleanDatabase();

        // Create user
        const signup = await request(app).post('/api/auth/signup').send(validUser);
        token = signup.body.token;

        // Create board
        const board = await request(app)
            .post('/api/boards')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Task Board' });
        boardId = board.body.board.id;

        // Create list
        const list = await request(app)
            .post(`/api/boards/${boardId}/lists`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'To Do' });
        listId = list.body.list.id;
    });

    // ── Create Task ─────────────────────────────────────────────────

    describe('POST /api/lists/:listId/tasks', () => {
        it('should create a task', async () => {
            const res = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New Task', description: 'A test task' });

            expect(res.status).toBe(201);
            expect(res.body.task.title).toBe('New Task');
            expect(res.body.task.listId).toBe(listId);
            expect(res.body.task.position).toBe(0);
        });

        it('should auto-increment position', async () => {
            await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Task 1' });

            const res = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Task 2' });

            expect(res.body.task.position).toBe(1);
        });
    });

    // ── Update Task ─────────────────────────────────────────────────

    describe('PUT /api/tasks/:taskId', () => {
        it('should update task fields', async () => {
            const create = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Original' });

            const res = await request(app)
                .put(`/api/tasks/${create.body.task.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated', priority: 'high' });

            expect(res.status).toBe(200);
            expect(res.body.task.title).toBe('Updated');
            expect(res.body.task.priority).toBe('high');
        });
    });

    // ── Move Task ───────────────────────────────────────────────────

    describe('PUT /api/tasks/:taskId/move', () => {
        it('should move a task to another list', async () => {
            // Create second list
            const list2 = await request(app)
                .post(`/api/boards/${boardId}/lists`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Done' });

            const task = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Movable Task' });

            const res = await request(app)
                .put(`/api/tasks/${task.body.task.id}/move`)
                .set('Authorization', `Bearer ${token}`)
                .send({ listId: list2.body.list.id, position: 0 });

            expect(res.status).toBe(200);
            expect(res.body.task.listId).toBe(list2.body.list.id);
        });
    });

    // ── Delete Task ─────────────────────────────────────────────────

    describe('DELETE /api/tasks/:taskId', () => {
        it('should delete a task', async () => {
            const task = await request(app)
                .post(`/api/lists/${listId}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Delete Me' });

            const res = await request(app)
                .delete(`/api/tasks/${task.body.task.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    // ── List CRUD ───────────────────────────────────────────────────

    describe('List Operations', () => {
        it('should get lists for a board', async () => {
            const res = await request(app)
                .get(`/api/boards/${boardId}/lists`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.lists).toHaveLength(1);
        });

        it('should update a list name', async () => {
            const res = await request(app)
                .put(`/api/lists/${listId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Name' });

            expect(res.status).toBe(200);
            expect(res.body.list.name).toBe('Updated Name');
        });

        it('should delete a list', async () => {
            const res = await request(app)
                .delete(`/api/lists/${listId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
