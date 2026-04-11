# Ratna Inventory Management - Frontend Integration Guide

Welcome to the Ratna Inventory Management API documentation! This guide is specifically designed for frontend developers to understand the system architecture, RBAC (Role-Based Access Control) matrix, and core workflows for seamless integration.

---

## 1. High-Level System Architecture

The Ratna backend follows a **stone-based model** measuring inventory by **Weight (RATI or CARAT)** and **Stone Count**. 

- **Centralized Product Catalog:** Products exist globally.
- **Inventory Matrix:** 
  - **Central Inventory:** Master stock received by the Super Admin.
  - **Store Inventory:** Stock allocated to individual stores.
- **Strict Data Isolation:** A `CASHIER` or `STORE_ADMIN` can **only** interact with inventory, bills, and customers associated with their assigned `storeId`.

---

## 2. Authentication Flow

The API uses **JWT (JSON Web Tokens)**.

1. Call `POST /api/v1/auth/login` with email and password.
2. The response contains an `accessToken` and `refreshToken`.
3. The JWT payload includes the user's `role` and `storeId` (if assigned).
4. Send the `accessToken` in the Authorization header for all subsequent requests:
   ```http
   Authorization: Bearer <your_access_token>
   ```

---

## 3. Role-Based Implementation Guide (Frontend Perspective)

Different roles require entirely different frontend views. **Do not** show Super Admin menus to a Cashier.

### 👑 SUPER_ADMIN (HQ / Owner)
**What to build for them:**
- **Full Dashboard:** Aggregated data across *all* stores (`GET /api/v1/audit/reports/dashboard`).
- **User & Store Management:** Forms to create `User`, `Store`, `Category`, and `Product` (Only Super Admin can do `POST/PATCH/DELETE` on these).
- **Central Inventory Management:** Screens to add new stock to central (`POST /api/v1/inventory/central`) and allocate stock to branch stores (`POST /api/v1/inventory/allocate`).
- **Global Reports:** Access to full ledger, all invoices, and cross-store inventory summary.

### 🏢 STORE_ADMIN (Branch Manager)
**What to build for them:**
- **Store Dashboard:** Metrics specific to their assigned store (`GET /api/v1/audit/reports/store/:storeId`).
- **Read-Only Master Data:** Can view/search Products and Categories, but **cannot create or edit** them.
- **Store Inventory View:** View current stock available in their store (`GET /api/v1/inventory/store/:storeId`).
- **Full Scope Rights:** Can perform all Cashier actions for their store (Billing, Cancellations, Refunds).

### 🧑‍💻 CASHIER (POS Operator)
**What to build for them:**
- **Point of Sale (POS) Screen:** The main billing interface.
  - Fetch available products for their store: `GET /api/v1/inventory/store/:storeId`
  - Upsert customer details: `POST /api/v1/billing/customers`
  - Generate Invoice: `POST /api/v1/billing/invoices`
  - Cancel Invoice: Cancel their store's invoices if mistakes are made (`PATCH /api/v1/billing/invoices/:id/cancel`)
- **Read-Only Access:** Can view their store's past invoices, basic product catalog, and their store's inventory. 
- **Refund Management:** Can fully initiate, approve, and reject refunds for their store (`POST /api/v1/refunds` and `PATCH /api/v1/refunds/:id/approve`).

---

## 4. Core Workflows & Endpoints

> **Interactive Swagger UI:** Visit `/api/docs` on the running backend server to test these endpoints directly!

### A. Point of Sale (Billing) Flow
For the `CASHIER` role.

**1. Create/Find Customer (Optional but common)**
```http
POST /api/v1/billing/customers
Body: { "name": "John Doe", "phone": "9876543210" }
Response: { "data": { "id": "customer_id", ... } }
```

**2. Generate Invoice**
*Backend auto-calculates total price (weight × product.pricePerUnit + GST) and auto-deducts from Store Inventory.*
```http
POST /api/v1/billing/invoices
Body: {
  "storeId": "store_id_from_cashier_token",
  "customerId": "customer_id", // Optional
  "paymentMethod": "CASH", // 'CASH', 'CARD', 'UPI', 'MIXED'
  "items": [
    {
      "productId": "product_id",
      "weight": 1.5, // Total weight sold
      "stoneCount": 2 // Number of stones
    }
  ]
}
```

### B. Refund Flow
When a customer returns an item.

**1. Initiate Refund (Cashier)**
Scan the RFID tag that was printed on the original receipt.
```http
POST /api/v1/refunds
Body: {
  "rfid": "RFID-INV-DEL-20261010-0001-001",
  "returnedWeight": 1.5,
  "returnedStones": 2,
  "reason": "Customer didn't like it"
}
```
*Note: The backend checks the weight. If it exactly matches, it auto-approves. If it differs, it goes to `PENDING`.*

**2. Approve Refund (Cashier / Store Admin)**
Cashiers and Store Admins see a list of pending refunds for their store (`GET /api/v1/refunds?status=PENDING`) and approve them.
```http
PATCH /api/v1/refunds/:refundId/approve
Body: { "approvalNotes": "Checked and verified" }
```

### C. Inventory Management Flow
For the `SUPER_ADMIN` role.

**1. Receive New Stock (HQ)**
```http
POST /api/v1/inventory/central
Body: {
  "productId": "product_id",
  "totalWeight": 100.5,
  "totalStones": 50,
  "notes": "Batch 1 from supplier"
}
```

**2. Allocate to Branch Store**
Transfers stock from HQ to a specific branch.
```http
POST /api/v1/inventory/allocate
Body: {
  "productId": "product_id",
  "storeId": "destination_store_id",
  "weight": 20.0,
  "stoneCount": 10
}
```

### D. Reporting & Dashboards
The backend handles all heavy data aggregation.

**1. Global KPI Dashboard (Super Admin Only)**
```http
GET /api/v1/audit/reports/dashboard
```

**2. Sales Trend Chart Data (All Roles, natively isolated)**
```http
GET /api/v1/audit/reports/trend?fromDate=2024-01-01&toDate=2024-01-31
```
*Returns an array of daily revenues, perfect for rendering a line chart.*

**3. Top Selling Products (All Roles)**
```http
GET /api/v1/audit/reports/top-products?limit=5
```

---

## 5. Error Handling & Standardization

All API responses follow a strict format:

**Success Response (2xx)**
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

**Paginated Success Response (200)**
```json
{
  "success": true,
  "message": "List retrieved",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response (4xx / 5xx)**
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE" // e.g., "VALIDATION_FAILED", "INSUFFICIENT_STOCK"
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource was successfully created.
- `400 Bad Request`: Validation failure or business logic error (e.g., Insufficient stock).
- `401 Unauthorized`: Missing or invalid JWT token. Logout the user and redirect to login.
- `403 Forbidden`: User does not have the required role (e.g., Cashier trying to allocate stock).
- `404 Not Found`: The requested resource or ID does not exist.
- `429 Too Many Requests`: Rate limiter triggered. Back off and retry.
