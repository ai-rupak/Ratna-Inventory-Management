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

    // Seed Categories First
    const categoriesToSeed = ['Ring', 'Necklace', 'Bangles', 'Earrings'];
    const categoryMap = {};
    for (const name of categoriesToSeed) {
      let category = await prisma.category.findUnique({ where: { name } });
      if (!category) {
        category = await prisma.category.create({
          data: { name, description: `All ${name} items` }
        });
        logger.info(`Category created: ${name}`);
      } else {
        logger.info(`Category already exists: ${name}`);
      }
      categoryMap[name] = category.id;
    }

    // Create sample products (stone-based, priced per RATI or CARAT)
    const products = [
      {
        sku: 'RING-CAR-001',
        name: 'Ruby Ring',
        categoryId: categoryMap['Ring'],
        weightUnit: 'CARAT',
        pricePerUnit: 12000,
        hsnCode: '71039900',
        gstRate: 3.0,
      },
      {
        sku: 'NECK-RAT-001',
        name: 'Emerald Necklace',
        categoryId: categoryMap['Necklace'],
        weightUnit: 'RATI',
        pricePerUnit: 8500,
        hsnCode: '71039900',
        gstRate: 3.0,
      },
      {
        sku: 'BANG-CAR-001',
        name: 'Sapphire Bangle Set',
        categoryId: categoryMap['Bangles'],
        weightUnit: 'CARAT',
        pricePerUnit: 9500,
        hsnCode: '71039900',
        gstRate: 3.0,
      },
      {
        sku: 'EARR-RAT-001',
        name: 'Diamond Earrings',
        categoryId: categoryMap['Earrings'],
        weightUnit: 'RATI',
        pricePerUnit: 25000,
        hsnCode: '71039900',
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
