import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../setup';

describe('Board Endpoints', () => {
    let token: string;

    const validUser = {
        email: 'board-test@example.com',
        password: 'Password123',
        username: 'Board Tester',
    };

    beforeEach(async () => {
        await cleanDatabase();
        const res = await request(app).post('/api/auth/signup').send(validUser);
        token = res.body.token;
    });

    // ── Create Board ────────────────────────────────────────────────

    describe('POST /api/boards', () => {
        it('should create a board', async () => {
            const res = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Test Board', description: 'A test board' });

            expect(res.status).toBe(201);
            expect(res.body.board.name).toBe('Test Board');
            expect(res.body.board.members).toHaveLength(1);
            expect(res.body.board.members[0].role).toBe('owner');
        });

        it('should return 400 without name', async () => {
            const res = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 without auth', async () => {
            const res = await request(app)
                .post('/api/boards')
                .send({ name: 'Test Board' });

            expect(res.status).toBe(401);
        });
    });

    // ── List Boards ─────────────────────────────────────────────────

    describe('GET /api/boards', () => {
        it('should list user boards with pagination', async () => {
            // Create 3 boards
            for (let i = 1; i <= 3; i++) {
                await request(app)
                    .post('/api/boards')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ name: `Board ${i}` });
            }

            const res = await request(app)
                .get('/api/boards')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.boards).toHaveLength(3);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBe(3);
        });

        it('should search boards by name', async () => {
            await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Alpha Board' });
            await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Beta Board' });

            const res = await request(app)
                .get('/api/boards?search=alpha')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.boards).toHaveLength(1);
            expect(res.body.boards[0].name).toBe('Alpha Board');
        });
    });

    // ── Get Board ───────────────────────────────────────────────────

    describe('GET /api/boards/:boardId', () => {
        it('should return board with lists and members', async () => {
            const create = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Detail Board' });

            const boardId = create.body.board.id;

            const res = await request(app)
                .get(`/api/boards/${boardId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.board.id).toBe(boardId);
            expect(res.body.board.lists).toBeDefined();
            expect(res.body.board.members).toHaveLength(1);
        });

        it('should return 403 for non-member', async () => {
            const create = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Private Board' });

            const other = await request(app)
                .post('/api/auth/signup')
                .send({ email: 'other@example.com', password: 'Password123', username: 'Other User' });

            const res = await request(app)
                .get(`/api/boards/${create.body.board.id}`)
                .set('Authorization', `Bearer ${other.body.token}`);

            expect(res.status).toBe(403);
        });
    });

    // ── Delete Board ────────────────────────────────────────────────

    describe('DELETE /api/boards/:boardId', () => {
        it('should delete a board', async () => {
            const create = await request(app)
                .post('/api/boards')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'To Delete' });

            const res = await request(app)
                .delete(`/api/boards/${create.body.board.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);

            // Verify it's gone
            const list = await request(app)
                .get('/api/boards')
                .set('Authorization', `Bearer ${token}`);
            expect(list.body.boards).toHaveLength(0);
        });
    });
});
