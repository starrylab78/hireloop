import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDB, stopTestDB, clearTestDB } from '../setup.js';
import { createApp } from '../../src/app.js';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

const app = createApp();

beforeAll(async () => { await startTestDB(); });
afterAll(async () => { await stopTestDB(); });
beforeEach(async () => { await clearTestDB(); });

describe('Auth flow', () => {
  it('registers a candidate and sets auth cookies', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Candidate',
      email: 'jane@test.dev',
      password: 'Password123!',
      role: 'candidate',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('jane@test.dev');
    expect(res.body.user.passwordHash).toBeUndefined(); // never leak the hash
    expect(res.headers['set-cookie'].some((c) => c.startsWith('hl_access='))).toBe(true);
    expect(res.headers['set-cookie'].some((c) => c.startsWith('hl_refresh='))).toBe(true);
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({ name: 'A', email: 'dup@test.dev', password: 'Password123!', role: 'candidate' });
    const res = await request(app).post('/api/auth/register').send({ name: 'B', email: 'dup@test.dev', password: 'Password123!', role: 'candidate' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Jane', email: 'jane2@test.dev', password: 'Password123!', role: 'candidate' });

    const good = await request(app).post('/api/auth/login').send({ email: 'jane2@test.dev', password: 'Password123!' });
    expect(good.status).toBe(200);

    const bad = await request(app).post('/api/auth/login').send({ email: 'jane2@test.dev', password: 'wrong' });
    expect(bad.status).toBe(401);
    expect(bad.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects registration with a too-short password (Zod validation)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Jane', email: 'short@test.dev', password: 'short', role: 'candidate' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('allows a logged-in user to fetch /me, and blocks it without a cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Jane', email: 'jane3@test.dev', password: 'Password123!', role: 'candidate' });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('jane3@test.dev');

    const noAuth = await request(app).get('/api/auth/me');
    expect(noAuth.status).toBe(401);
  });

  it('rotates the refresh token and issues a new access token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Jane', email: 'jane4@test.dev', password: 'Password123!', role: 'candidate' });

    const refreshRes = await agent.post('/api/auth/refresh');
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.headers['set-cookie'].some((c) => c.startsWith('hl_refresh='))).toBe(true);
  });

  it('logout invalidates the session so /me subsequently 401s', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ name: 'Jane', email: 'jane5@test.dev', password: 'Password123!', role: 'candidate' });
    await agent.post('/api/auth/logout');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});
