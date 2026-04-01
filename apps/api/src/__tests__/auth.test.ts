import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  it('GET /health should return healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/auth/register should validate input', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should return 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});
