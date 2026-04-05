const request = require('supertest');
const app = require('../app');

describe('Refunds', () => {
  describe('POST /api/v1/refunds', () => {
    it('should return 404 for invalid RFID', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ rfid: 'RFID-DOES-NOT-EXIST', returnedWeight: 5.0 });

      expect(res.status).toBe(404);
    });

    it('should reject missing rfid', async () => {
      const res = await request(app)
        .post('/api/v1/refunds')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ returnedWeight: 5.0 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/refunds', () => {
    it('should return list of refunds for STORE_ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/refunds')
        .set('Authorization', `Bearer ${global.storeAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny access to CASHIER', async () => {
      const res = await request(app)
        .get('/api/v1/refunds')
        .set('Authorization', `Bearer ${global.cashierToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/refunds/:id/approve', () => {
    it('should return 404 for non-existent refund', async () => {
      const res = await request(app)
        .patch('/api/v1/refunds/000000000000000000000000/approve')
        .set('Authorization', `Bearer ${global.storeAdminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
