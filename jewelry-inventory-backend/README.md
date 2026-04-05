# Jewelry Inventory Management System - Backend

A production-grade, centralized jewelry inventory management system backend built with Node.js, Express, Prisma, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens, RBAC (Role-Based Access Control)
- **User Management**: Create and manage users with different roles (Super Admin, Store Admin, Cashier)
- **Store Management**: Manage multiple stores with centralized control
- **Product Management**: Product catalog with SKU generation, search, and filtering
- **Inventory Engine**: Central inventory with ACID stock allocation to stores, inter-store transfers, and full ledger trail
- **Billing System**: POS invoice creation (ACID transaction), dynamic pricing (gold rate × weight + making charge + GST), RFID tagging per item, customer management
- **Refund System**: RFID-based returns, weight tolerance auto-approval, manager approval workflow, stock reversal
- **Gold Rate Management**: Live gold rate per purity (24K/22K/18K/14K) stored in DB — cashiers always fetch the current rate
- **Audit & Reporting**: Audit logs, sales reports, inventory snapshots, per-store dashboard
- **Background Jobs**: Bull queue workers for PDF invoice generation, email notifications, and report pre-computation
- **API Documentation**: Interactive Swagger UI at `/api/docs`
- **Security**: Rate limiting, input validation, error handling, distributed locking
- **Database**: MongoDB with Prisma ORM, full transaction support

## Tech Stack

- **Runtime**: Node.js v20 LTS
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **ORM**: Prisma
- **Database**: MongoDB (with replica set for transactions)
- **Cache**: Redis
- **Authentication**: JWT
- **Validation**: express-validator
- **Logging**: Winston

## Prerequisites

- Node.js >= 20.0.0
- MongoDB >= 7.0 (with replica set)
- Redis >= 7.0
- Docker and Docker Compose (optional)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
copy .env.example .env
```

4. Update `.env` with your configuration

5. Start MongoDB and Redis (using Docker):
```bash
docker-compose up -d
```

6. Generate Prisma client:
```bash
npm run prisma:generate
```

7. Synchronize database with schema:
```bash
npm run prisma:migrate
```
(Note: For MongoDB, this runs `prisma db push`)

8. Seed the database:
```bash
npm run seed
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Visualizing Data

### Method 1: Prisma Studio (Recommended)
Prisma Studio is a visual editor for your data.

```bash
npm run prisma:studio
```
This will open a web interface at `http://localhost:5555`.

### Method 2: MongoDB Compass
You can connect using MongoDB Compass with the connection string:
`mongodb://localhost:27017/jewelry_inventory?replicaSet=rs0&readPreference=primary&ssl=false`

### Method 3: Command Line (mongosh)
Access the database directly via Docker:
```bash
docker exec -it jewelry_mongodb mongosh jewelry_inventory
```
Then run queries like:
```javascript
db.User.find()
db.Invoice.find()
```

## Default Credentials

After seeding the database, you can login with:

- **Super Admin**: admin@jewelry.com / Admin@123
- **Store Admin**: storeadmin@jewelry.com / StoreAdmin@123
- **Cashier**: cashier@jewelry.com / Cashier@123

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Get current user profile

### Users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user
- `PATCH /api/v1/users/:id/activate` - Activate user

### Stores
- `POST /api/v1/stores` - Create store
- `GET /api/v1/stores` - Get all stores
- `GET /api/v1/stores/:id` - Get store by ID
- `PATCH /api/v1/stores/:id` - Update store
- `DELETE /api/v1/stores/:id` - Deactivate store
- `PATCH /api/v1/stores/:id/activate` - Activate store
- `GET /api/v1/stores/:id/stats` - Get store statistics

### Products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/search?q=query` - Search products
- `GET /api/v1/products/:id` - Get product by ID
- `PATCH /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Deactivate product
- `PATCH /api/v1/products/:id/activate` - Activate product

### Inventory (Phase 2)
- `POST /api/v1/inventory/central` - Receive stock into central inventory *(Super Admin)*
- `GET /api/v1/inventory/central` - List all central inventory *(Super Admin)*
- `GET /api/v1/inventory/central/:productId` - Get central stock for a product *(Super Admin)*
- `PATCH /api/v1/inventory/central/:productId/adjust` - Manual stock adjustment *(Super Admin)*
- `POST /api/v1/inventory/allocate` - Allocate stock central → store *(Super Admin)*
- `POST /api/v1/inventory/transfer` - Inter-store stock transfer *(Super Admin)*
- `GET /api/v1/inventory/summary` - Cross-store inventory summary *(Super Admin)*
- `GET /api/v1/inventory/store/:storeId` - View store inventory *(Store Admin, Super Admin)*
- `GET /api/v1/inventory/ledger` - Query inventory ledger *(Super Admin)*
- `GET /api/v1/inventory/ledger/summary` - Ledger summary by type *(Super Admin)*

### Billing (Phase 2)
- `POST /api/v1/billing/invoices` - Create invoice (POS sale) *(Cashier, Store Admin, Super Admin)*
- `GET /api/v1/billing/invoices` - List invoices *(Cashier, Store Admin, Super Admin)*
- `GET /api/v1/billing/invoices/:id` - Get invoice by ID *(Cashier, Store Admin, Super Admin)*
- `PATCH /api/v1/billing/invoices/:id/cancel` - Cancel invoice *(Store Admin, Super Admin)*
- `POST /api/v1/billing/customers` - Upsert customer by phone *(Cashier, Store Admin, Super Admin)*
- `GET /api/v1/billing/customers` - List customers *(Store Admin, Super Admin)*
- `GET /api/v1/billing/customers/:id` - Get customer with invoice history *(Cashier, Store Admin, Super Admin)*

### Refunds (Phase 2)
- `POST /api/v1/refunds` - Initiate refund by RFID *(Cashier, Store Admin, Super Admin)*
- `GET /api/v1/refunds` - List refunds *(Store Admin, Super Admin)*
- `GET /api/v1/refunds/:id` - Get refund details *(Cashier, Store Admin, Super Admin)*
- `PATCH /api/v1/refunds/:id/approve` - Approve pending refund *(Store Admin, Super Admin)*
- `PATCH /api/v1/refunds/:id/reject` - Reject pending refund *(Store Admin, Super Admin)*

### Gold Rates (Phase 3)
- `POST /api/v1/gold-rates` - Set gold rate *(Super Admin)*
- `GET /api/v1/gold-rates` - List rate history *(All authenticated)*
- `GET /api/v1/gold-rates/current` - Current rates for all purities *(All authenticated)*
- `GET /api/v1/gold-rates/current/:purity` - Current rate for a specific purity *(All authenticated)*

### Documentation & Health
- `GET /api/docs` - Interactive Swagger UI (all endpoints documented)
- `GET /api/docs.json` - Raw OpenAPI JSON spec
- `GET /health` - System health (DB + Redis status, uptime, memory)

## Pricing Formula

```
goldPrice    = netGoldWeight × goldRatePerGram
makingCharge = (PER_GRAM | PERCENTAGE | FIXED — per product config)
gstAmount    = (goldPrice + makingCharge) × gstRate / 100
totalAmount  = goldPrice + makingCharge + gstAmount
```

## Refund Workflow

1. Cashier scans RFID at POS → `POST /api/v1/refunds`
2. System checks weight deviation vs. `WEIGHT_TOLERANCE_GRAMS` (default `0.01g`)
3. Within tolerance → **auto-approved** + stock reversed immediately
4. Exceeds tolerance → status `PENDING`, requires manager approval
5. Manager calls `PATCH /api/v1/refunds/:id/approve` → stock reversed + ledger updated

## Project Structure

```
src/
├── app.js                      # Express app setup
├── server.js                   # Server entry point
├── common/                     # Shared utilities
│   ├── middleware/             # Express middleware (auth, rbac, validate, error)
│   ├── utils/                  # Helper functions (response, encryption, logger)
│   └── constants/              # Constants, enums, error classes
├── database/                   # Database layer
│   ├── prisma/                 # Prisma client setup
│   └── seeders/                # Database seeders
└── modules/                    # Feature modules
    ├── auth/                   # Authentication
    ├── users/                  # User management
    ├── stores/                 # Store management
    ├── products/               # Product catalog
    ├── inventory/              # Inventory engine (Phase 2)
    │   ├── central-inventory.service.js
    │   ├── store-inventory.service.js
    │   ├── allocation.service.js
    │   ├── ledger.service.js
    │   ├── inventory.controller.js
    │   ├── inventory.validators.js
    │   └── inventory.routes.js
    ├── billing/                # Billing system (Phase 2)
    │   ├── pricing.service.js
    │   ├── billing.service.js
    │   ├── invoice.service.js
    │   ├── customer.service.js
    │   ├── billing.controller.js
    │   ├── billing.validators.js
    │   └── billing.routes.js
    ├── refunds/                # Refund system (Phase 2)
    │   ├── refund.service.js
    │   ├── approval.service.js
    │   ├── refunds.controller.js
    │   ├── refund.validators.js
    │   └── refunds.routes.js
    └── audit/                  # Audit & reporting (Phase 2)
        ├── audit-log.service.js
        ├── report.service.js
        ├── audit.controller.js
        ├── audit.validators.js
        └── audit.routes.js
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database

## Environment Variables

See `.env.example` for all available environment variables.

Key Phase 2 variables:
| Variable | Default | Description |
|----------|---------|-------------|
| `WEIGHT_TOLERANCE_GRAMS` | `0.01` | Max weight deviation (grams) for auto-approving refunds |

## License

MIT
