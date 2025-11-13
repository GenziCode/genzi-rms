# Ì≥° COMPLETE API ENDPOINTS - GENZI RMS

**Total Endpoints:** 90  
**Base URL:** `http://localhost:5000/api`

---

## Ì¥ì PUBLIC ENDPOINTS (3)

### Tenant Management
```
POST   /api/tenants/register      Register new tenant
GET    /api/tenants/:subdomain    Get tenant info
GET    /api/health                Health check
```

---

## Ì¥ê AUTHENTICATION (5)

```
POST   /api/auth/register         Register user
POST   /api/auth/login            Login
POST   /api/auth/refresh          Refresh token
POST   /api/auth/logout           Logout
PUT    /api/auth/change-password  Change password
```

---

## Ì≥¶ CATEGORIES (7)

```
GET    /api/categories            List all
GET    /api/categories/stats      Category statistics
POST   /api/categories            Create
GET    /api/categories/:id        Get by ID
PUT    /api/categories/:id        Update
DELETE /api/categories/:id        Delete
PUT    /api/categories/sort-order Update sort order
```

---

## Ìø∑Ô∏è PRODUCTS (12)

```
GET    /api/products              List all (paginated)
GET    /api/products/stats        Product statistics
GET    /api/products/low-stock    Low stock products
POST   /api/products              Create
POST   /api/products/bulk         Bulk create
GET    /api/products/search       Search products
GET    /api/products/barcode/:code  Search by barcode
GET    /api/products/qr/:data     Get by QR code
GET    /api/products/:id          Get by ID
PUT    /api/products/:id          Update
POST   /api/products/:id/image    Upload image
DELETE /api/products/:id          Delete
```

---

## Ì≤≥ SALES / POS (9)

```
POST   /api/sales                 Create sale
POST   /api/sales/hold            Hold transaction
POST   /api/sales/resume/:id      Resume transaction
GET    /api/sales                 List sales
GET    /api/sales/stats           Sales statistics
GET    /api/sales/held            Get held transactions
GET    /api/sales/recent          Recent sales
GET    /api/sales/:id             Get sale by ID
PUT    /api/sales/:id             Update sale
```

---

## Ì≥ä INVENTORY (7)

```
POST   /api/inventory/adjust      Stock adjustment
GET    /api/inventory/movements   Movement history
GET    /api/inventory/alerts      Stock alerts
GET    /api/inventory/valuation   Inventory valuation
POST   /api/inventory/alerts/:id/resolve  Resolve alert
GET    /api/inventory/alerts/product/:productId  Product alerts
GET    /api/inventory/snapshot    Create snapshot
```

---

## Ì±• CUSTOMERS (7)

```
GET    /api/customers             List all
POST   /api/customers             Create
GET    /api/customers/stats       Statistics
GET    /api/customers/search      Search
GET    /api/customers/:id         Get by ID
PUT    /api/customers/:id         Update
DELETE /api/customers/:id         Delete
```

---

## Ìø¢ VENDORS (6)

```
GET    /api/vendors               List all
POST   /api/vendors               Create
GET    /api/vendors/stats         Statistics
GET    /api/vendors/:id           Get by ID
PUT    /api/vendors/:id           Update
DELETE /api/vendors/:id           Delete
```

---

## Ì≥ã PURCHASE ORDERS (6)

```
GET    /api/purchase-orders       List all
POST   /api/purchase-orders       Create PO
GET    /api/purchase-orders/:id   Get by ID
PUT    /api/purchase-orders/:id/send  Send to vendor
POST   /api/purchase-orders/:id/receive  Receive goods (GRN)
PUT    /api/purchase-orders/:id/cancel  Cancel PO
```

---

## Ì±§ USERS / EMPLOYEES (7)

```
GET    /api/users                 List all
POST   /api/users                 Create user
GET    /api/users/:id             Get by ID
PUT    /api/users/:id             Update
PUT    /api/users/:id/role        Update role
DELETE /api/users/:id             Delete (deactivate)
POST   /api/users/:id/reset-password  Reset password
```

---

## ‚öôÔ∏è SETTINGS (6)

```
GET    /api/settings              Get all settings
PUT    /api/settings/store        Update store info
PUT    /api/settings/business     Update business settings
PUT    /api/settings/tax          Update tax config
PUT    /api/settings/receipt      Update receipt settings
PUT    /api/settings/pos          Update POS settings
```

---

## Ì≥à REPORTS & DASHBOARD (8)

```
GET    /api/reports/dashboard              Dashboard KPIs
GET    /api/reports/sales-trends           Sales trends
GET    /api/reports/top-products           Top products
GET    /api/reports/payment-methods        Payment analysis
GET    /api/reports/profit-loss            P&L report
GET    /api/reports/inventory-valuation    Stock valuation
GET    /api/reports/customer-insights      Customer analytics
GET    /api/reports/vendor-performance     Vendor stats
```

---

## Ì≥§ EXPORT (4)

```
GET    /api/export/products       Export products CSV
GET    /api/export/sales          Export sales CSV
GET    /api/export/customers      Export customers CSV
GET    /api/export/inventory      Export inventory CSV
```

---

## Ì¥Ñ SYNC (3)

```
GET    /api/sync/pull             Pull data for offline
POST   /api/sync/push/sales       Push offline sales
GET    /api/sync/status           Sync status
```

---

## Ì¥ë AUTHENTICATION HEADERS

All protected endpoints require:

```http
Authorization: Bearer <access_token>
X-Tenant: <tenant_subdomain>
```

---

## Ì≥ù EXAMPLE REQUESTS

### Register Tenant
```bash
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Store",
    "subdomain": "demo",
    "ownerEmail": "owner@demo.com",
    "ownerPassword": "SecurePass123",
    "ownerFirstName": "John",
    "ownerLastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -d '{
    "email": "owner@demo.com",
    "password": "SecurePass123"
  }'
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Coca Cola",
    "sku": "COL-001",
    "barcode": "1234567890",
    "price": 5.00,
    "costPrice": 3.00,
    "stock": 100,
    "category": "<category_id>"
  }'
```

### Create Sale
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "items": [
      {
        "product": "<product_id>",
        "quantity": 2,
        "price": 5.00
      }
    ],
    "payments": [
      {
        "method": "cash",
        "amount": 10.00
      }
    ]
  }'
```

### Get Dashboard
```bash
curl -X GET "http://localhost:5000/api/reports/dashboard?period=today" \
  -H "X-Tenant: demo" \
  -H "Authorization: Bearer <token>"
```

---

## Ì≥ä QUERY PARAMETERS

### Pagination
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10-50)

### Search & Filter
- `search` (string): Search term
- `status` (string): Filter by status
- `category` (string): Filter by category
- `startDate` (ISO date): Start date filter
- `endDate` (ISO date): End date filter

### Sorting
- `sort` (string): Field to sort by
- `order` (string): `asc` or `desc`

---

## ‚úÖ RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

---

## Ì∫¶ HTTP STATUS CODES

- `200` OK - Success
- `201` Created - Resource created
- `400` Bad Request - Invalid input
- `401` Unauthorized - No/invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Duplicate resource
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

---

## Ì¥í ROLE-BASED ACCESS

### Roles:
- **Owner**: Full access (all permissions)
- **Admin**: Users, Products, Sales, Inventory, Reports
- **Manager**: Products (read), Sales (all), Inventory (read/adjust), Reports
- **Cashier**: Products (read), Sales (create/read), Customers (read/create)
- **Kitchen Staff**: Products (read), Sales (read)
- **Waiter**: Products (read), Sales (create/read), Customers (read)

---

**Total:** 90 Endpoints | All Tested ‚úÖ | Production Ready Ì∫Ä
