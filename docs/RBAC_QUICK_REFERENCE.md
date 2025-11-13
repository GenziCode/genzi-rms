# 🔐 RBAC Implementation - Quick Reference

**Quick overview of RBAC implementation for RMS POS**  
**Created:** 2025-11-13 20:00 UTC  
**Last Updated:** 2025-11-13 20:00 UTC

---

## 📋 Current vs. New System

### Current System
- ✅ Basic roles: `OWNER`, `ADMIN`, `MANAGER`, `CASHIER`, etc.
- ✅ Simple `permissions` array (string[])
- ✅ Basic `authorize()` middleware
- ❌ No role management UI
- ❌ No scope-based filtering
- ❌ No field-level permissions

### New System (RBCD)
- ✅ **20+ roles** (Executive, Administrative, Operational, Support, External)
- ✅ **Granular permissions** (`module:action` format)
- ✅ **Multi-role support** (users can have multiple roles)
- ✅ **Data scope** (Store, Warehouse, Region, Record, Field level)
- ✅ **Role management UI** (create, edit, assign roles)
- ✅ **Dynamic UI rendering** (hide/disable based on permissions)
- ✅ **Time-based access** (working hours restrictions)
- ✅ **Delegation support** (temporary role assignments)

---

## 🎯 Key Roles for RMS POS

| Role | Access Level | Typical Use Case |
|------|-------------|-----------------|
| **Owner** | Full system access | Business owner |
| **Super Admin** | Full tenant access + role management | IT administrator |
| **Store Manager** | Full store operations | Store manager |
| **Inventory Manager** | Inventory management only | Stock manager |
| **Cashier** | POS transactions only | Sales staff |
| **Finance Officer** | Financial data + reports | Accountant |
| **Auditor** | Read-only access | Compliance officer |

---

## 🔑 Permission Format

**Pattern:** `{module}:{action}` or `{module}:{resource}:{action}`

**Examples:**
- `pos:create` - Create POS transactions
- `products:update` - Update products
- `inventory:adjustments:approve` - Approve inventory adjustments
- `settings:payments:update` - Update payment settings
- `reports:financial:view` - View financial reports

---

## 📊 Modules & Permissions

| Module | Key Permissions |
|--------|-----------------|
| **POS** | `pos:create`, `pos:read`, `pos:refund`, `pos:void` |
| **Products** | `products:create`, `products:update`, `products:delete`, `products:pricing:view` |
| **Inventory** | `inventory:read`, `inventory:adjust`, `inventory:transfer`, `inventory:approve` |
| **Customers** | `customers:create`, `customers:update`, `customers:delete` |
| **Invoices** | `invoices:create`, `invoices:send`, `invoices:approve` |
| **Payments** | `payments:create`, `payments:refund`, `payments:settings:update` |
| **Reports** | `reports:view`, `reports:financial:view`, `reports:export` |
| **Settings** | `settings:read`, `settings:store:update`, `settings:payments:update` |
| **Users** | `users:create`, `users:update`, `users:delete`, `users:roles:assign` |
| **Roles** | `roles:create`, `roles:update`, `roles:delete`, `roles:permissions:manage` |

---

## 🌐 Data Scope Types

| Scope Type | Description | Example |
|-----------|-------------|---------|
| **Tenant** | All data in tenant | Default for most roles |
| **Store** | Specific store(s) | Store Manager (Store A only) |
| **Warehouse** | Specific warehouse(s) | Inventory Manager (WH-1 only) |
| **Record** | Own records only | Sales Executive (own leads) |
| **Field** | Field-level restrictions | Hide cost prices |

---

## 🔧 Backend Changes Summary

### New Files
- `backend/src/models/role.model.ts` - Role schema
- `backend/src/models/permission.model.ts` - Permission registry
- `backend/src/models/roleAssignment.model.ts` - Role assignment tracking
- `backend/src/services/role.service.ts` - Role management
- `backend/src/services/permission.service.ts` - Permission utilities
- `backend/src/services/scope.service.ts` - Scope filtering
- `backend/src/middleware/permission.middleware.ts` - Permission checks
- `backend/src/middleware/scope.middleware.ts` - Scope filtering
- `backend/src/routes/role.routes.ts` - Role APIs
- `backend/src/routes/permission.routes.ts` - Permission APIs

### Updated Files
- `backend/src/models/user.model.ts` - Add `roles[]`, `scope`, `delegatedFrom`
- `backend/src/middleware/auth.middleware.ts` - Load roles, compute permissions
- All route files - Add permission middleware
- All service files - Add scope filtering
- All controller files - Add scope checks

---

## 🎨 Frontend Changes Summary

### New Files
- `frontend/src/types/permissions.types.ts` - Permission types
- `frontend/src/services/permission.service.ts` - Permission utilities
- `frontend/src/hooks/usePermissions.ts` - Permission hooks
- `frontend/src/hooks/useScope.ts` - Scope hooks
- `frontend/src/components/auth/PermissionGuard.tsx` - Permission guard
- `frontend/src/components/auth/ModuleGuard.tsx` - Module guard
- `frontend/src/pages/RolesPage.tsx` - Role management page
- `frontend/src/components/roles/RoleForm.tsx` - Role form
- `frontend/src/components/roles/PermissionSelector.tsx` - Permission selector
- `frontend/src/components/users/UserRoleAssignment.tsx` - Role assignment

### Updated Files
- All page components - Add permission checks
- All form components - Add field-level checks
- `frontend/src/components/layout/Sidebar.tsx` - Filter menu items
- `frontend/src/routes/index.tsx` - Add route guards
- `frontend/src/pages/UsersPage.tsx` - Add role management
- `frontend/src/pages/DashboardPage.tsx` - Filter widgets

---

## 📅 Implementation Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| **Phase 1: Foundation** | 2 weeks | Models, services, hooks |
| **Phase 2: Authorization** | 1 week | Middleware, route protection |
| **Phase 3: Services & UI** | 2 weeks | Service updates, UI conditional rendering |
| **Phase 4: Role Management UI** | 1 week | Admin interface for roles |
| **Phase 5: Advanced Features** | 1 week | Time-based access, delegation |
| **Phase 6: Data Scope** | 1 week | Scope filtering, field-level permissions |
| **Phase 7: Testing & QA** | 1 week | Unit, integration, E2E tests |
| **Phase 8: Migration** | 1 week | Data migration, deployment |

**Total: 10 weeks**

---

## 🚀 Quick Start Guide

### For Developers

1. **Backend:**
   ```typescript
   // Add permission check to route
   router.post(
     '/products',
     authenticate,
     requirePermission('products:create'),
     productController.create
   );
   
   // Apply scope in service
   async list(tenantId: string, userScope: UserScope) {
     const query = { tenantId };
     if (userScope.type === 'store') {
       query.storeId = { $in: userScope.ids };
     }
     return Product.find(query);
   }
   ```

2. **Frontend:**
   ```typescript
   // Use permission hook
   const { hasPermission } = usePermissions();
   
   // Conditionally render
   {hasPermission('products:create') && (
     <Button onClick={handleCreate}>Add Product</Button>
   )}
   
   // Guard route
   <Route
     path="/products"
     element={
       <ModuleGuard module="products">
         <ProductsPage />
       </ModuleGuard>
     }
   />
   ```

### For Admins

1. **Create Role:**
   - Go to Settings → Roles
   - Click "Create Role"
   - Enter name, code, description
   - Select permissions
   - Set scope (if needed)
   - Save

2. **Assign Role:**
   - Go to Users → Select user
   - Click "Assign Role"
   - Select role(s)
   - Set scope override (if needed)
   - Save

3. **Manage Permissions:**
   - Go to Roles → Select role
   - Click "Edit Permissions"
   - Check/uncheck permissions
   - Save

---

## ✅ Checklist

### Backend
- [ ] Create Role model
- [ ] Create Permission registry
- [ ] Update User model
- [ ] Create Role service
- [ ] Create Permission service
- [ ] Create Scope service
- [ ] Update auth middleware
- [ ] Create permission middleware
- [ ] Create scope middleware
- [ ] Update all routes
- [ ] Update all services
- [ ] Update all controllers
- [ ] Create role APIs
- [ ] Create permission APIs
- [ ] Add audit logging
- [ ] Write unit tests
- [ ] Write integration tests

### Frontend
- [ ] Create permission types
- [ ] Create permission service
- [ ] Create permission hooks
- [ ] Create scope hooks
- [ ] Create PermissionGuard
- [ ] Create ModuleGuard
- [ ] Update all pages
- [ ] Update all forms
- [ ] Update navigation
- [ ] Create RolesPage
- [ ] Create RoleForm
- [ ] Create PermissionSelector
- [ ] Create UserRoleAssignment
- [ ] Update UsersPage
- [ ] Add access denied page
- [ ] Write component tests
- [ ] Write E2E tests

### Migration
- [ ] Create migration script
- [ ] Test migration on dev
- [ ] Create rollback plan
- [ ] Document migration steps
- [ ] Schedule migration window

---

## 📚 Documentation

- **Full Roadmap:** `docs/RBAC_IMPLEMENTATION_ROADMAP.md`
- **Architecture Guide:** `docs/RBAC_ARCHITECTURE.md` (to be created)
- **API Documentation:** `docs/RBAC_API.md` (to be created)
- **Frontend Guide:** `docs/RBAC_FRONTEND.md` (to be created)
- **Admin Guide:** `docs/ADMIN_ROLE_MANAGEMENT.md` (to be created)

---

**Last Updated:** 2025-01-13

