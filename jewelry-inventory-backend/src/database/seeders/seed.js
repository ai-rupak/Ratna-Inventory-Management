const { prisma } = require('../prisma/client');
const { hashPassword } = require('../../common/utils/encryption.util');
const logger = require('../../common/utils/logger.util');

/**
 * Seed database with initial data
 */
async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Create super admin user
    const superAdminEmail = 'admin@jewelry.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword('Admin@123');
      const superAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
      logger.info(`Super admin created: ${superAdmin.email}`);
    } else {
      logger.info('Super admin already exists');
    }

    // Create sample store
    const storeCode = 'MAIN001';
    const existingStore = await prisma.store.findUnique({
      where: { code: storeCode },
    });

    let store;
    if (!existingStore) {
      store = await prisma.store.create({
        data: {
          code: storeCode,
          name: 'Main Branch',
          address: '123 Gold Street, Jewelry Plaza',
          city: 'Mumbai',
          state: 'Maharashtra',
          phone: '9876543210',
          isActive: true,
        },
      });
      logger.info(`Sample store created: ${store.name}`);
    } else {
      store = existingStore;
      logger.info('Sample store already exists');
    }

    // Create store admin user
    const storeAdminEmail = 'storeadmin@jewelry.com';
    const existingStoreAdmin = await prisma.user.findUnique({
      where: { email: storeAdminEmail },
    });

    if (!existingStoreAdmin) {
      const hashedPassword = await hashPassword('StoreAdmin@123');
      const storeAdmin = await prisma.user.create({
        data: {
          email: storeAdminEmail,
          password: hashedPassword,
          firstName: 'Store',
          lastName: 'Admin',
          role: 'STORE_ADMIN',
          storeId: store.id,
          isActive: true,
        },
      });
      logger.info(`Store admin created: ${storeAdmin.email}`);
    } else {
      logger.info('Store admin already exists');
    }

    // Create cashier user
    const cashierEmail = 'cashier@jewelry.com';
    const existingCashier = await prisma.user.findUnique({
      where: { email: cashierEmail },
    });

    if (!existingCashier) {
      const hashedPassword = await hashPassword('Cashier@123');
      const cashier = await prisma.user.create({
        data: {
          email: cashierEmail,
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Cashier',
          role: 'CASHIER',
          storeId: store.id,
          isActive: true,
        },
      });
      logger.info(`Cashier created: ${cashier.email}`);
    } else {
      logger.info('Cashier already exists');
    }

    // Create sample products
    const products = [
      {
        sku: 'RING-22K-001',
        name: 'Gold Ring 22K Classic',
        category: 'Ring',
        purity: '22K',
        hsnCode: '71131910',
        makingChargeType: 'PER_GRAM',
        makingCharge: 500,
        gstRate: 3.0,
      },
      {
        sku: 'NECK-22K-001',
        name: 'Gold Necklace 22K Traditional',
        category: 'Necklace',
        purity: '22K',
        hsnCode: '71131910',
        makingChargeType: 'PER_GRAM',
        makingCharge: 600,
        gstRate: 3.0,
      },
      {
        sku: 'BANG-22K-001',
        name: 'Gold Bangles 22K Pair',
        category: 'Bangles',
        purity: '22K',
        hsnCode: '71131910',
        makingChargeType: 'FIXED',
        makingCharge: 5000,
        gstRate: 3.0,
      },
      {
        sku: 'EARR-18K-001',
        name: 'Diamond Earrings 18K',
        category: 'Earrings',
        purity: '18K',
        hsnCode: '71131910',
        makingChargeType: 'PERCENTAGE',
        makingCharge: 15,
        gstRate: 3.0,
      },
    ];

    for (const productData of products) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku },
      });

      if (!existingProduct) {
        await prisma.product.create({ data: productData });
        logger.info(`Product created: ${productData.name}`);
      } else {
        logger.info(`Product already exists: ${productData.name}`);
      }
    }

    logger.info('Database seeding completed successfully!');
    logger.info('\nDefault credentials:');
    logger.info('Super Admin: admin@jewelry.com / Admin@123');
    logger.info('Store Admin: storeadmin@jewelry.com / StoreAdmin@123');
    logger.info('Cashier: cashier@jewelry.com / Cashier@123');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

module.exports = seed;
