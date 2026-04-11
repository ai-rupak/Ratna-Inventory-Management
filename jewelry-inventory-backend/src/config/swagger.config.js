const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ratna Jewelry Inventory Management API',
      version: '1.0.0',
      description:
        'Production-grade centralized jewelry inventory management system. Supports multi-store operations, ACID-compliant transactions, RFID-based returns, and comprehensive audit trails.',
      contact: {
        name: 'API Support',
        email: 'support@ratnajewelry.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from POST /auth/login',
        },
      },
      schemas: {
        // ── Common ──────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        // ── Auth ────────────────────────────────────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@jewelry.com' },
            password: { type: 'string', minLength: 8, example: 'Admin@123' },
          },
        },
        // ── Inventory ───────────────────────────────────────────────────────
        ReceiveStockRequest: {
          type: 'object',
          required: ['productId', 'totalWeight'],
          properties: {
            productId: { type: 'string' },
            totalWeight: { type: 'number', example: 100.5 },
            totalStones: { type: 'integer', example: 10 },
            notes: { type: 'string' },
          },
        },
        AllocateRequest: {
          type: 'object',
          required: ['productId', 'storeId', 'weight'],
          properties: {
            productId: { type: 'string' },
            storeId: { type: 'string' },
            weight: { type: 'number', example: 50.0 },
            stoneCount: { type: 'integer', example: 5 },
            notes: { type: 'string' },
          },
        },
        // ── Billing ─────────────────────────────────────────────────────────
        CreateInvoiceRequest: {
          type: 'object',
          required: ['storeId', 'paymentMethod', 'items'],
          properties: {
            storeId: { type: 'string' },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'CARD', 'UPI', 'MIXED'],
            },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Priya Sharma' },
                phone: { type: 'string', example: '9876543210' },
                email: { type: 'string', format: 'email' },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'weight'],
                properties: {
                  productId: { type: 'string' },
                  weight: { type: 'number', example: 10.52, description: 'Weight in RATI or CARAT per product\'s weightUnit' },
                  stoneCount: { type: 'integer', example: 3 },
                },
              },
            },
          },
        },
        // ── Refunds ─────────────────────────────────────────────────────────
        InitiateRefundRequest: {
          type: 'object',
          required: ['rfid', 'returnedWeight'],
          properties: {
            rfid: { type: 'string', example: 'RFID-INV-ST1-20250221-0001-001' },
            returnedWeight: { type: 'number', example: 10.52 },
            reason: { type: 'string', example: 'Customer changed mind' },
          },
        },
        // (GoldRate schema removed)
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Stores', description: 'Store management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Inventory', description: 'Central and store inventory management' },
      { name: 'Billing', description: 'POS invoicing and customer management' },
      { name: 'Refunds', description: 'RFID-based refund management' },
      { name: 'Audit', description: 'Audit logs and reports' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Health', description: 'System health' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
