import request from 'supertest';
import app from '../../src/app';
import { cleanDatabase } from '../setup';

describe('Auth Endpoints', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    const validUser = {
        email: 'test@example.com',
        password: 'Password123',
        username: 'Test User',
    };

    // ── Signup ──────────────────────────────────────────────────────

    describe('POST /api/auth/signup', () => {
        it('should create a new user and return a token', async () => {
            const res = await request(app).post('/api/auth/signup').send(validUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(validUser.email);
            expect(res.body.user.username).toBe(validUser.username);
            expect(res.body.token).toBeDefined();
            // Should NOT return password hash
            expect(res.body.user.passwordHash).toBeUndefined();
            expect(res.body.user.password_hash).toBeUndefined();
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({ ...validUser, email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({ ...validUser, password: 'short' });

            expect(res.status).toBe(400);
        });

        it('should return 409 for duplicate email', async () => {
            await request(app).post('/api/auth/signup').send(validUser);
            const res = await request(app).post('/api/auth/signup').send(validUser);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });
    });

    // ── Login ───────────────────────────────────────────────────────

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/auth/signup').send(validUser);
        });

        it('should return a token for valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: validUser.email, password: validUser.password });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: validUser.email, password: 'WrongPass1' });

            expect(res.status).toBe(401);
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nobody@example.com', password: 'Password123' });

            expect(res.status).toBe(401);
        });
    });

    // ── Me (protected route) ────────────────────────────────────────

    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const signup = await request(app).post('/api/auth/signup').send(validUser);
            const token = signup.body.token;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('should return 401 with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });
    });
});
