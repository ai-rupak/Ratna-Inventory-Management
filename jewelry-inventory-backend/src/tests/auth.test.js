const request = require('supertest');
const app = require('../app');

describe('Auth', () => {
  let refreshToken;

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@jewelry.com', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@jewelry.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@jewelry.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@jewelry.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/auth/profile');
      expect(res.status).toBe(401);
    });
  });
});
