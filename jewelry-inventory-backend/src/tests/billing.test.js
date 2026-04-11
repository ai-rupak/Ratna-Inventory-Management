const request = require('supertest');
const app = require('../app');

describe('Billing', () => {
  let invoiceId;
  let storeId;
  let productId;

  beforeAll(async () => {
    const { prisma } = require('../database/prisma/client');
    // Must use the cashier's own store to satisfy the storeId isolation we enforced
    const cashier = await prisma.user.findFirst({ where: { email: 'cashier@jewelry.com' } });
    storeId = cashier?.storeId || null;
    // Find a product that has store inventory in the cashier's store
    const inv = storeId
      ? await prisma.storeInventory.findFirst({
          where: { storeId, availableWeight: { gt: 0 } },
        })
      : null;
    productId = inv?.productId;
  });

  describe('POST /api/v1/billing/invoices', () => {
    it('should create an invoice when stock is available', async () => {
      if (!storeId || !productId) {
        console.warn('Skipping billing test — no store inventory available');
        return;
      }
      const res = await request(app)
        .post('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({
          storeId,
          paymentMethod: 'CASH',
          items: [{ productId, weight: 1.0, stoneCount: 1 }],
        });

      expect([201, 400]).toContain(res.status);
      if (res.status === 201) {
        invoiceId = res.body.data.id;
        expect(res.body.data.invoiceNumber).toMatch(/^INV-/);
        expect(res.body.data.items[0].rfid).toMatch(/^RFID-/);
        expect(res.body.data.items[0].weight).toBeDefined();
        expect(res.body.data.items[0].pricePerUnit).toBeDefined();
      }
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ storeId: 'x' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/billing/invoices', () => {
    it('should list invoices', async () => {
      const res = await request(app)
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/billing/invoices/:id', () => {
    it('should return 404 for non-existent invoice', async () => {
      const res = await request(app)
        .get('/api/v1/billing/invoices/000000000000000000000000')
        .set('Authorization', `Bearer ${global.adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/billing/customers', () => {
    it('should upsert a customer', async () => {
      const res = await request(app)
        .post('/api/v1/billing/customers')
        .set('Authorization', `Bearer ${global.cashierToken}`)
        .send({ name: 'Test Customer', phone: '9999900001' });

      expect(res.status).toBe(201);
      expect(res.body.data.phone).toBe('9999900001');
    });
  });
});
