# 🔧 INTEGRATION TODO LIST

## Status: Backend & Frontend Analysis Complete

**Last Updated:** November 12, 2025

---

## 📊 BACKEND vs FRONTEND COMPARISON

### ✅ **Backend Endpoints Available (21 Route Files)**

| # | Backend Route | Endpoint | Frontend Service | Status |
|---|--------------|----------|------------------|--------|
| 1 | `tenant.routes.ts` | `/api/tenants` | ❌ Missing | 🔴 CREATE |
| 2 | `auth.routes.ts` | `/api/auth` | ✅ auth.service.ts | ✅ Complete |
| 3 | `category.routes.ts` | `/api/categories` | ✅ categories.service.ts | ✅ Complete |
| 4 | `product.routes.ts` | `/api/products` | ✅ products.service.ts | ✅ Complete |
| 5 | `pos.routes.ts` | `/api/sales` | ✅ pos.service.ts | ✅ Complete |
| 6 | `inventory.routes.ts` | `/api/inventory` | ✅ inventory.service.ts | ✅ Complete |
| 7 | `customer.routes.ts` | `/api/customers` | ✅ customers.service.ts | ✅ Complete |
| 8 | `vendor.routes.ts` | `/api/vendors` | ✅ vendors.service.ts | ✅ Complete |
| 9 | `purchaseOrder.routes.ts` | `/api/purchase-orders` | ✅ purchaseOrders.service.ts | ✅ Complete |
| 10 | `invoice.routes.ts` | `/api/invoices` | ✅ invoice.service.ts | ✅ Complete |
| 11 | `notification.routes.ts` | `/api/notifications` | ✅ notifications.service.ts | ✅ Complete |
| 12 | `audit.routes.ts` | `/api/audit-logs` | ❌ Missing | 🔴 CREATE |
| 13 | `payment.routes.ts` | `/api/payments` | ❌ Missing | 🔴 CREATE |
| 14 | `webhook.routes.ts` | `/api/webhooks` | N/A (Stripe) | ✅ N/A |
| 15 | `system-webhook.routes.ts` | `/api/webhooks-config` | ❌ Missing | 🔴 CREATE |
| 16 | `user.routes.ts` | `/api/users` | ✅ users.service.ts | ✅ Complete |
| 17 | `settings.routes.ts` | `/api/settings` | ✅ settings.service.ts | ✅ Complete |
| 18 | `reports.routes.ts` | `/api/reports` | ✅ reports.service.ts | ✅ Complete |
| 19 | `export.routes.ts` | `/api/export` | ✅ export.service.ts | ✅ Complete |
| 20 | `sync.routes.ts` | `/api/sync` | ❌ Missing | 🟡 OPTIONAL |
| 21 | `file.routes.ts` | `/api/files` | N/A (DISABLED) | ✅ N/A |

---

## 🔴 CRITICAL: MISSING FRONTEND SERVICES (4)

### 1. **payments.service.ts** - HIGH PRIORITY
**Backend:** `/api/payments` (8 endpoints)
**Endpoints:**
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments` - Get all payments
- `POST /api/payments/:id/refund` - Refund payment
- `GET /api/payments/customer/:customerId` - Get customer payments
- `GET /api/payments/invoice/:invoiceId` - Get invoice payments
- `GET /api/payments/statistics` - Get payment statistics

**Where Used:**
- ✅ `PaymentsPage.tsx` (page exists, needs service)
- ✅ `PaymentCreateModal.tsx` (modal exists, needs service)

**Action:** CREATE `frontend/src/services/payments.service.ts`

---

### 2. **audit.service.ts** - HIGH PRIORITY
**Backend:** `/api/audit-logs` (6 endpoints)
**Endpoints:**
- `GET /api/audit-logs/statistics` - Get audit statistics
- `GET /api/audit-logs/export` - Export logs as CSV
- `GET /api/audit-logs/:id` - Get log by ID
- `GET /api/audit-logs` - Get all logs (with filters)
- `GET /api/audit-logs/user/:userId` - Get user activity
- `GET /api/audit-logs/entity/:entityType/:entityId` - Get entity history

**Where Used:**
- ✅ `AuditLogsPage.tsx` (page exists, needs service)
- ✅ `AuditDetailModal.tsx` (modal exists, needs service)

**Action:** CREATE `frontend/src/services/audit.service.ts`

---

### 3. **webhooks.service.ts** - MEDIUM PRIORITY
**Backend:** `/api/webhooks-config` (8 endpoints)
**Endpoints:**
- `GET /api/webhooks-config` - Get all webhooks
- `GET /api/webhooks-config/:id` - Get webhook by ID
- `POST /api/webhooks-config` - Create webhook
- `PUT /api/webhooks-config/:id` - Update webhook
- `DELETE /api/webhooks-config/:id` - Delete webhook
- `GET /api/webhooks-config/:id/logs` - Get delivery logs
- `POST /api/webhooks-config/:id/test` - Test webhook
- `PATCH /api/webhooks-config/:id/toggle` - Toggle active status

**Where Used:**
- ✅ `WebhooksPage.tsx` (page exists, needs service)

**Action:** CREATE `frontend/src/services/webhooks.service.ts`

---

### 4. **sync.service.ts** - LOW PRIORITY (Optional)
**Backend:** `/api/sync` (3 endpoints)
**Endpoints:**
- `POST /api/sync/pull` - Pull data for offline cache
- `POST /api/sync/push` - Push offline sales
- `GET /api/sync/status/:deviceId` - Get sync status

**Where Used:**
- ❌ No page created yet (offline sync is optional feature)

**Action:** CREATE `frontend/src/services/sync.service.ts` (OPTIONAL)

---

## 🟡 PAGES USING MOCK DATA (Need Service Integration)

### 1. **PaymentsPage.tsx**
**Current:** Uses mock empty array `[]`
**Needs:** 
- ✅ Create `payments.service.ts`
- Connect to `GET /api/payments`
- Connect to `POST /api/payments/intent`
- Connect to `POST /api/payments/:id/refund`

**Lines to Change:**
```typescript
// Line 23-27 - BEFORE:
const { data: payments = [], isLoading } = useQuery<Payment[]>({
  queryKey: ['payments'],
  queryFn: async () => {
    // TODO: Replace with actual API call
    return [];
  },
});

// AFTER (once service created):
const { data: payments = [], isLoading } = useQuery({
  queryKey: ['payments'],
  queryFn: () => paymentsService.getAll(),
});
```

---

### 2. **AuditLogsPage.tsx**
**Current:** Uses mock empty array `[]`
**Needs:**
- ✅ Create `audit.service.ts`
- Connect to `GET /api/audit-logs`
- Connect to `GET /api/audit-logs/statistics`
- Connect to `GET /api/audit-logs/export`

**Lines to Change:**
```typescript
// Line 31-36 - BEFORE:
const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
  queryKey: ['audit-logs', filters],
  queryFn: async () => {
    // TODO: Implement API call
    return [];
  },
});

// AFTER (once service created):
const { data, isLoading } = useQuery({
  queryKey: ['audit-logs', filters],
  queryFn: () => auditService.getAll(filters),
});
const logs = data?.logs || [];
```

---

### 3. **WebhooksPage.tsx**
**Current:** Uses mock empty array `[]`
**Needs:**
- ✅ Create `webhooks.service.ts`
- Connect to `GET /api/webhooks-config`
- Connect to `POST /api/webhooks-config`
- Connect to `POST /api/webhooks-config/:id/test`

**Lines to Change:**
```typescript
// Line 48-53 - BEFORE:
const { data: webhooks = [], isLoading } = useQuery<WebhookConfig[]>({
  queryKey: ['webhooks'],
  queryFn: async () => {
    // TODO: Implement API call
    return [];
  },
});

// AFTER (once service created):
const { data, isLoading } = useQuery({
  queryKey: ['webhooks'],
  queryFn: () => webhooksService.getAll(),
});
const webhooks = data?.webhooks || [];
```

---

## ✅ PAGES WITH WORKING SERVICES (No Changes Needed)

These pages are already connected to backend services:

1. ✅ **LoginPage** → auth.service.ts
2. ✅ **RegisterPage** → auth.service.ts
3. ✅ **DashboardPage** → reports.service.ts
4. ✅ **CategoriesPage** → categories.service.ts
5. ✅ **ProductsPage** → products.service.ts
6. ✅ **POSPage** → pos.service.ts + products.service.ts + customers.service.ts
7. ✅ **InventoryPage** → inventory.service.ts
8. ✅ **CustomersPage** → customers.service.ts
9. ✅ **VendorsPage** → vendors.service.ts
10. ✅ **PurchaseOrdersPage** → purchaseOrders.service.ts
11. ✅ **UsersPage** → users.service.ts
12. ✅ **SettingsPage** → settings.service.ts
13. ✅ **ReportsPage** → reports.service.ts
14. ✅ **ExportPage** → export.service.ts
15. ✅ **InvoicesPage** → invoice.service.ts
16. ✅ **NotificationsPage** → notifications.service.ts
17. ✅ **UserProfilePage** → (local state, no backend calls needed)

---

## 🔧 ACTION PLAN

### **Phase 1: Create Missing Services** ⏱️ 30 mins

1. **Create `payments.service.ts`**
   - 8 API methods
   - Connect to PaymentsPage
   - Connect to PaymentCreateModal

2. **Create `audit.service.ts`**
   - 6 API methods
   - Connect to AuditLogsPage
   - Connect to AuditDetailModal

3. **Create `webhooks.service.ts`**
   - 8 API methods
   - Connect to WebhooksPage

4. **Create `sync.service.ts`** (OPTIONAL)
   - 3 API methods
   - For future offline sync feature

---

### **Phase 2: Update Pages to Use Real Services** ⏱️ 15 mins

1. Update `PaymentsPage.tsx` - replace mock data
2. Update `AuditLogsPage.tsx` - replace mock data
3. Update `WebhooksPage.tsx` - replace mock data
4. Update all modals to call actual APIs

---

### **Phase 3: Testing** ⏱️ 1 hour

**Prerequisites:**
```bash
# Start backend
cd genzi-rms/backend
npm run dev

# Start frontend
cd genzi-rms/frontend
npm run dev
```

**Test Checklist:**

✅ **Authentication:**
- [ ] Login works
- [ ] Register works
- [ ] Password reset works

✅ **Products & Categories:**
- [ ] Create/Edit/Delete category
- [ ] Create/Edit/Delete product
- [ ] Search & filters work

✅ **POS:**
- [ ] Add products to cart
- [ ] Process sale with payment
- [ ] Hold/Resume transaction
- [ ] Print receipt

✅ **Inventory:**
- [ ] Stock adjustment works
- [ ] Stock transfer works
- [ ] Low stock alerts show

✅ **Customers:**
- [ ] CRUD operations work
- [ ] Purchase history loads
- [ ] Loyalty points update

✅ **Vendors & POs:**
- [ ] Create vendor
- [ ] Create purchase order
- [ ] Receive goods

✅ **Invoices:**
- [ ] Create invoice
- [ ] View invoice detail
- [ ] Download PDF
- [ ] Send email

✅ **Payments:**
- [ ] View payments list
- [ ] Create payment
- [ ] Process refund

✅ **Audit Logs:**
- [ ] View logs
- [ ] Filter logs
- [ ] Export logs
- [ ] View detail

✅ **Webhooks:**
- [ ] Create webhook
- [ ] Test webhook
- [ ] View delivery logs

✅ **Notifications:**
- [ ] View notifications
- [ ] Mark as read
- [ ] Delete notification

✅ **Users & Settings:**
- [ ] Manage users
- [ ] Update settings
- [ ] Change profile

---

## 📋 FILE STRUCTURE

```
genzi-rms/
├── backend/
│   └── src/
│       └── routes/
│           ├── ✅ auth.routes.ts
│           ├── ✅ category.routes.ts
│           ├── ✅ product.routes.ts
│           ├── ✅ pos.routes.ts
│           ├── ✅ inventory.routes.ts
│           ├── ✅ customer.routes.ts
│           ├── ✅ vendor.routes.ts
│           ├── ✅ purchaseOrder.routes.ts
│           ├── ✅ invoice.routes.ts
│           ├── ✅ notification.routes.ts
│           ├── ✅ audit.routes.ts
│           ├── ✅ payment.routes.ts
│           ├── ✅ system-webhook.routes.ts
│           ├── ✅ user.routes.ts
│           ├── ✅ settings.routes.ts
│           ├── ✅ reports.routes.ts
│           ├── ✅ export.routes.ts
│           └── ✅ sync.routes.ts
│
└── frontend/
    └── src/
        ├── services/
        │   ├── ✅ auth.service.ts
        │   ├── ✅ categories.service.ts
        │   ├── ✅ products.service.ts
        │   ├── ✅ pos.service.ts
        │   ├── ✅ inventory.service.ts
        │   ├── ✅ customers.service.ts
        │   ├── ✅ vendors.service.ts
        │   ├── ✅ purchaseOrders.service.ts
        │   ├── ✅ invoice.service.ts
        │   ├── ✅ notifications.service.ts
        │   ├── 🔴 audit.service.ts (CREATE)
        │   ├── 🔴 payments.service.ts (CREATE)
        │   ├── 🔴 webhooks.service.ts (CREATE)
        │   ├── 🟡 sync.service.ts (OPTIONAL)
        │   ├── ✅ users.service.ts
        │   ├── ✅ settings.service.ts
        │   ├── ✅ reports.service.ts
        │   └── ✅ export.service.ts
        │
        └── pages/
            ├── ✅ All pages created (22 pages)
            └── ⚠️  3 pages need service integration
```

---

## 🎯 SUMMARY

### **What's Complete:**
✅ Backend: 144 endpoints across 21 route files  
✅ Frontend: 22 pages created  
✅ Frontend: 53+ components created  
✅ Frontend: 14 service files created  
✅ UI/UX: 100% complete  

### **What's Missing:**
🔴 **3 Critical Services** (payments, audit, webhooks)  
🟡 **1 Optional Service** (sync)  
⚠️  **3 Pages** need service integration  

### **Estimated Time to Complete:**
- Create services: **30 minutes**
- Update pages: **15 minutes**
- Testing: **1 hour**
- **Total: ~2 hours** to full production readiness!

---

## 🚀 NEXT STEPS

1. **Create missing services** (I can do this now!)
2. **Update pages to use services**
3. **Start backend server**
4. **Test end-to-end**
5. **Fix any bugs**
6. **Deploy!** 🎉

---

**Ready to create the missing services?** Let me know and I'll build them immediately! 💪

