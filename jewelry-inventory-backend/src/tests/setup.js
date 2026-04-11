/**
 * Global test setup — connects to DB and provides auth helper
 */
require('dotenv').config({ path: '.env' });
const { connectDatabase, disconnectDatabase } = require('../database/prisma/client');

jest.setTimeout(30000);

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

/**
 * Helper — login and return JWT token for given credentials
 */
const request = require('supertest');
const app = require('../app');

global.getAuthToken = async (email, password) => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  
  return res.body.data?.tokens?.accessToken || res.body.data?.accessToken;
};

global.adminToken = null;
global.storeAdminToken = null;
global.cashierToken = null;
global.testCategoryId = null;

beforeAll(async () => {
  global.adminToken = await getAuthToken('admin@jewelry.com', 'Admin@123');
  global.storeAdminToken = await getAuthToken('storeadmin@jewelry.com', 'StoreAdmin@123');
  global.cashierToken = await getAuthToken('cashier@jewelry.com', 'Cashier@123');

  // Fetch a real category ID for product tests
  const { prisma } = require('../database/prisma/client');
  const category = await prisma.category.findFirst({ where: { isActive: true } });
  global.testCategoryId = category?.id || null;
});
