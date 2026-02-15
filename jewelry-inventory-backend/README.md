# Jewelry Inventory Management System - Backend

A production-grade, centralized jewelry inventory management system backend built with Node.js, Express, Prisma, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens, RBAC (Role-Based Access Control)
- **User Management**: Create and manage users with different roles (Super Admin, Store Admin, Cashier)
- **Store Management**: Manage multiple stores with centralized control
- **Product Management**: Product catalog with SKU generation, search, and filtering
- **Security**: Rate limiting, input validation, error handling, distributed locking
- **Database**: MongoDB with Prisma ORM, transaction support
- **Caching**: Redis for session management and distributed locks

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
db.Product.find()
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

## Project Structure

```
src/
├── app.js                      # Express app setup
├── server.js                   # Server entry point
├── common/                     # Shared utilities
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Helper functions
│   └── constants/             # Constants and enums
├── database/                  # Database layer
│   ├── prisma/               # Prisma client and schema
│   ├── repositories/         # Repository pattern
│   ├── services/             # Transaction and lock services
│   └── seeders/              # Database seeders
└── modules/                   # Feature modules
    ├── auth/                 # Authentication
    ├── users/                # User management
    ├── stores/               # Store management
    └── products/             # Product management
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

## License

MIT
