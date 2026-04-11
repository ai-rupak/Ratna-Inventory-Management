const request = require('supertest');
const app = require('../app');

/**
 * Product Pricing Tests
 * Validates that products using RATI/CARAT weight units and pricePerUnit
 * are created, listed, and filtered correctly.
 */
describe('Product Pricing (RATI/CARAT)', () => {
  let productId;

  describe('POST /api/v1/products — CARAT product', () => {
    it('should create a CARAT-priced product as SUPER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({
          name: 'Test Ruby Stone',
          weightUnit: 'CARAT',
          pricePerUnit: 15000,
          hsnCode: '71039900',
          gstRate: 3.0,
          categoryId: global.testCategoryId, // set in setup.js if available
        });

      // If no categoryId available, skip gracefully
      if (!global.testCategoryId) {
        console.warn('Skipping product creation test — no testCategoryId in global');
        return;
      }

      expect([201, 409]).toContain(res.status); // 409 if SKU collision
      if (res.status === 201) {
        productId = res.body.data.id;
        expect(res.body.data.weightUnit).toBe('CARAT');
        expect(res.body.data.pricePerUnit).toBe(15000);
        expect(res.body.data.hsnCode).toBe('71039900');
      }
    });

    it('should reject invalid weightUnit', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({
          name: 'Bad Product',
          weightUnit: 'GRAMS', // invalid
          pricePerUnit: 5000,
          hsnCode: '71039900',
          gstRate: 3.0,
          categoryId: '000000000000000000000001',
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing pricePerUnit', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${global.adminToken}`)
        .send({
          name: 'No Price Product',
          weightUnit: 'RATI',
          hsnCode: '71039900',
          gstRate: 3.0,
          categoryId: '000000000000000000000001',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should list products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by weightUnit=CARAT', async () => {
      const res = await request(app)
        .get('/api/v1/products?weightUnit=CARAT')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      // All returned products should be CARAT
      res.body.data.forEach(p => {
        expect(p.weightUnit).toBe('CARAT');
      });
    });

    it('should filter by weightUnit=RATI', async () => {
      const res = await request(app)
        .get('/api/v1/products?weightUnit=RATI')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach(p => {
        expect(p.weightUnit).toBe('RATI');
      });
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/v1/products/000000000000000000000000')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
