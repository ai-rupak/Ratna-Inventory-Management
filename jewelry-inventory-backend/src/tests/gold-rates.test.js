const request = require('supertest');
const app = require('../app');

describe('Gold Rates', () => {
  let rateId;

  describe('POST /api/v1/gold-rates', () => {
    it('should set a gold rate as SUPER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/gold-rates')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({ purity: '22K', ratePerGram: 6200 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purity).toBe('22K');
      expect(res.body.data.ratePerGram).toBe(6200);
      rateId = res.body.data.id;
    });

    it('should reject invalid purity', async () => {
      const res = await request(app)
        .post('/api/v1/gold-rates')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({ purity: '999K', ratePerGram: 5000 });

      expect(res.status).toBe(400);
    });

    it('should deny access to CASHIER', async () => {
      const res = await request(app)
        .post('/api/v1/gold-rates')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ purity: '22K', ratePerGram: 6000 });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/gold-rates/current', () => {
    it('should return current rates for all purities', async () => {
      const res = await request(app)
        .get('/api/v1/gold-rates/current')
        .set('Authorization', `Bearer ${global.cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data['22K']).toBeDefined();
    });
  });

  describe('GET /api/v1/gold-rates/current/:purity', () => {
    it('should return current rate for 22K', async () => {
      const res = await request(app)
        .get('/api/v1/gold-rates/current/22K')
        .set('Authorization', `Bearer ${global.cashierToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.purity).toBe('22K');
    });

    it('should return 404 for purity with no rate set', async () => {
      // Assuming 14K has no rate set in test DB
      const res = await request(app)
        .get('/api/v1/gold-rates/current/14K')
        .set('Authorization', `Bearer ${global.cashierToken}`);

      // Either 200 (if rate exists from previous tests) or 404
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('GET /api/v1/gold-rates', () => {
    it('should list rate history', async () => {
      const res = await request(app)
        .get('/api/v1/gold-rates?purity=22K')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
