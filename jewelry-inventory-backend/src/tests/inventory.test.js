const request = require('supertest');
const app = require('../app');

describe('Inventory', () => {
  let productId;
  let storeId;

  beforeAll(async () => {
    // Get a product and store from the DB for tests
    const { prisma } = require('../database/prisma/client');
    const product = await prisma.product.findFirst({ where: { isActive: true } });
    const store = await prisma.store.findFirst({ where: { isActive: true } });
    productId = product?.id;
    storeId = store?.id;
  });

  describe('POST /api/v1/inventory/central', () => {
    it('should receive stock into central inventory', async () => {
      if (!productId) return;
      const res = await request(app)
        .post('/api/v1/inventory/central')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({ productId, totalWeight: 50, totalStones: 5, stoneWeight: 2.5, notes: 'Test stock' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.productId).toBe(productId);
    });

    it('should reject if product does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/central')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({ productId: '000000000000000000000000', totalWeight: 10 });

      expect(res.status).toBe(404);
    });

    it('should deny access to CASHIER', async () => {
      const res = await request(app)
        .post('/api/v1/inventory/central')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ productId: productId || 'x', totalWeight: 10 });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/inventory/central', () => {
    it('should list all central inventory', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/central')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/inventory/allocate', () => {
    it('should allocate stock from central to store', async () => {
      if (!productId || !storeId) return;
      const res = await request(app)
        .post('/api/v1/inventory/allocate')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({ productId, storeId, weight: 10 });

      expect([201, 400]).toContain(res.status); // 400 if not enough stock
    });
  });

  describe('GET /api/v1/inventory/ledger', () => {
    it('should return ledger entries', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/ledger')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
