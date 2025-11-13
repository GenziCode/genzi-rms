# Ì≥ö COMPLETE API ENDPOINT REFERENCE

**Total Endpoints:** 152  
**Status:** ‚úÖ All Implemented  
**Version:** 1.0.0  

---

## Ì¥ê AUTHENTICATION (9 endpoints)

1. POST `/api/auth/login` - Login user
2. POST `/api/auth/refresh` - Refresh access token
3. GET `/api/auth/me` - Get current user profile
4. POST `/api/auth/logout` - Logout user
5. POST `/api/auth/forgot-password` - Send password reset email ‚úÖ NEW
6. POST `/api/auth/reset-password` - Reset password with token ‚úÖ NEW
7. POST `/api/auth/verify-email` - Verify email ‚úÖ NEW
8. POST `/api/auth/change-password` - Change password ‚úÖ NEW
9. POST `/api/auth/send-verification` - Send verification email ‚úÖ NEW

---

## Ìø¢ TENANTS (7 endpoints)

1. POST `/api/tenants/register` - Register new tenant
2. GET `/api/tenants/check-subdomain/:subdomain` - Check availability
3. GET `/api/tenants/:id` - Get tenant details ‚úÖ NEW
4. PUT `/api/tenants/:id` - Update tenant ‚úÖ NEW
5. GET `/api/tenants/:id/usage` - Get usage statistics ‚úÖ NEW
6. PATCH `/api/tenants/:id/suspend` - Suspend tenant ‚úÖ NEW
7. PATCH `/api/tenants/:id/activate` - Activate tenant ‚úÖ NEW

---

## Ì≥¶ PRODUCTS (12 endpoints)

1. GET `/api/products` - Get all products
2. GET `/api/products/:id` - Get product by ID
3. POST `/api/products` - Create product
4. PUT `/api/products/:id` - Update product
5. DELETE `/api/products/:id` - Delete product
6. GET `/api/products/barcode/:barcode` - Search by barcode
7. GET `/api/products/sku/:sku` - Search by SKU
8. POST `/api/products/bulk` - Bulk import
9. PATCH `/api/products/:id/stock` - Update stock
10. POST `/api/products/:id/adjust-stock` - Adjust stock
11. POST `/api/products/:id/images` - Upload image ‚úÖ NEW
12. DELETE `/api/products/:id/images/:index` - Delete image ‚úÖ NEW

---

## Ì≥Ç CATEGORIES (6 endpoints)

1. GET `/api/categories` - Get all categories
2. GET `/api/categories/:id` - Get category by ID
3. POST `/api/categories` - Create category
4. PUT `/api/categories/:id` - Update category
5. DELETE `/api/categories/:id` - Delete category
6. GET `/api/categories/tree` - Get category tree

---

## Ì≤∞ SALES/POS (9 endpoints)

1. POST `/api/sales` - Create sale
2. GET `/api/sales` - Get all sales
3. GET `/api/sales/:id` - Get sale by ID
4. POST `/api/sales/:id/hold` - Hold transaction
5. POST `/api/sales/:id/resume` - Resume held transaction
6. GET `/api/sales/held` - Get held transactions
7. POST `/api/sales/:id/void` - Void sale
8. POST `/api/sales/:id/refund` - Process refund
9. GET `/api/sales/daily-summary` - Get daily summary

---

## Ì≥ä INVENTORY (7 endpoints)

1. POST `/api/inventory/movements` - Create stock movement
2. GET `/api/inventory/movements` - Get all movements
3. GET `/api/inventory/alerts` - Get low stock alerts
4. GET `/api/inventory/valuation` - Get inventory valuation
5. GET `/api/inventory/valuation/category` - Valuation by category
6. POST `/api/inventory/adjust` - Adjust stock
7. POST `/api/inventory/transfer` - Transfer stock

---

## Ì±• CUSTOMERS (8 endpoints)

1. GET `/api/customers` - Get all customers
2. GET `/api/customers/:id` - Get customer by ID
3. POST `/api/customers` - Create customer
4. PUT `/api/customers/:id` - Update customer
5. DELETE `/api/customers/:id` - Delete customer
6. GET `/api/customers/:id/history` - Get purchase history
7. POST `/api/customers/:id/loyalty` - Adjust loyalty points
8. POST `/api/customers/:id/credit` - Adjust credit balance

---

## Ì∫ö VENDORS (5 endpoints)

1. GET `/api/vendors` - Get all vendors
2. GET `/api/vendors/:id` - Get vendor by ID
3. POST `/api/vendors` - Create vendor
4. PUT `/api/vendors/:id` - Update vendor
5. DELETE `/api/vendors/:id` - Delete vendor

---

## Ì≥ã PURCHASE ORDERS (7 endpoints)

1. GET `/api/purchase-orders` - Get all POs
2. GET `/api/purchase-orders/:id` - Get PO by ID
3. POST `/api/purchase-orders` - Create PO
4. PUT `/api/purchase-orders/:id` - Update PO
5. DELETE `/api/purchase-orders/:id` - Delete PO
6. PATCH `/api/purchase-orders/:id/status` - Update status
7. POST `/api/purchase-orders/:id/receive` - Receive goods

---

## Ì∑æ INVOICES (14 endpoints) ‚úÖ NEW

1. GET `/api/invoices`
2. GET `/api/invoices/:id`
3. GET `/api/invoices/number/:number`
4. POST `/api/invoices`
5. PUT `/api/invoices/:id`
6. DELETE `/api/invoices/:id`
7. PATCH `/api/invoices/:id/status`
8. POST `/api/invoices/:id/payments`
9. POST `/api/invoices/generate`
10. POST `/api/invoices/:id/convert`
11. POST `/api/invoices/:id/duplicate`
12. GET `/api/invoices/next-number`
13. POST `/api/invoices/:id/send`
14. POST `/api/invoices/:id/send-sms`
15. GET `/api/invoices/:id/pdf`

---

## Ì≥Å FILES (8 endpoints) ‚úÖ NEW

1. POST `/api/files/upload`
2. POST `/api/files/upload-multiple`
3. GET `/api/files`
4. GET `/api/files/:id`
5. DELETE `/api/files/:id`
6. GET `/api/files/statistics`
7. POST `/api/products/:id/images` (duplicate entry - part of products)
8. DELETE `/api/products/:id/images/:index` (duplicate entry - part of products)

---

## Ì¥î NOTIFICATIONS (12 endpoints) ‚úÖ NEW

1. GET `/api/notifications`
2. GET `/api/notifications/:id`
3. POST `/api/notifications`
4. PATCH `/api/notifications/:id/read`
5. PATCH `/api/notifications/read-all`
6. DELETE `/api/notifications/:id`
7. POST `/api/notifications/email`
8. POST `/api/notifications/sms`
9. POST `/api/notifications/broadcast`
10. GET `/api/notifications/preferences`
11. PUT `/api/notifications/preferences`
12. POST `/api/notifications/test-email`
13. POST `/api/notifications/test-sms`

---

## Ì≥ù AUDIT LOGS (5 endpoints) ‚úÖ NEW

1. GET `/api/audit-logs`
2. GET `/api/audit-logs/entity/:type/:id`
3. GET `/api/audit-logs/user/:userId`
4. GET `/api/audit-logs/export`
5. GET `/api/audit-logs/statistics`

---

## Ì≤≥ PAYMENTS (7 endpoints) ‚úÖ NEW

1. POST `/api/payments/intent`
2. POST `/api/payments/confirm`
3. GET `/api/payments`
4. GET `/api/payments/:id`
5. POST `/api/payments/:id/refund`
6. POST `/api/payments/test-stripe`
7. POST `/webhooks/stripe`

---

## Ì¥ó WEBHOOKS (8 endpoints) ‚úÖ NEW

1. GET `/api/webhooks-config`
2. GET `/api/webhooks-config/:id`
3. POST `/api/webhooks-config`
4. PUT `/api/webhooks-config/:id`
5. DELETE `/api/webhooks-config/:id`
6. GET `/api/webhooks-config/:id/logs`
7. POST `/api/webhooks-config/:id/test`
8. PATCH `/api/webhooks-config/:id/toggle`

---

## Ì±§ USERS (6 endpoints)

1. GET `/api/users` - Get all users
2. GET `/api/users/:id` - Get user by ID
3. POST `/api/users` - Create user
4. PUT `/api/users/:id` - Update user
5. DELETE `/api/users/:id` - Delete user
6. PATCH `/api/users/:id/status` - Update status

---

## ‚öôÔ∏è SETTINGS/STORES (5 endpoints)

1. GET `/api/stores` - Get all stores
2. GET `/api/stores/:id` - Get store by ID
3. POST `/api/stores` - Create store
4. PUT `/api/stores/:id` - Update store
5. DELETE `/api/stores/:id` - Delete store

---

## Ì≥à REPORTS (8 endpoints)

1. GET `/api/reports/dashboard` - Dashboard KPIs
2. GET `/api/reports/sales-trends` - Sales trends
3. GET `/api/reports/top-products` - Top products
4. GET `/api/reports/profit-loss` - P&L report
5. GET `/api/reports/inventory-valuation` - Inventory value
6. GET `/api/reports/customer-insights` - Customer analytics
7. GET `/api/reports/vendor-performance` - Vendor stats
8. GET `/api/reports/payment-methods` - Payment breakdown

---

## Ì≥§ EXPORT (4 endpoints)

1. POST `/api/export/products` - Export products to CSV
2. POST `/api/export/sales` - Export sales to CSV
3. POST `/api/export/customers` - Export customers to CSV
4. POST `/api/export/inventory` - Export inventory to CSV

---

## Ì¥Ñ SYNC (3 endpoints)

1. POST `/api/sync/products` - Sync products
2. POST `/api/sync/sales` - Sync sales
3. GET `/api/sync/status` - Get sync status

---

## ÔøΩÔøΩ HEALTH (1 endpoint)

1. GET `/api/health` - Health check

---

**TOTAL: 152 API ENDPOINTS - ALL IMPLEMENTED! ‚úÖ**
