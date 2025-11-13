# 🔐 RBAC (Role-Based Access Control) Implementation Roadmap

**Document Type:** Implementation Roadmap  
**Target:** Comprehensive RBCD Framework for RMS POS  
**Created:** 2025-11-13 19:55 UTC  
**Last Updated:** 2025-11-13 19:55 UTC  
**Status:** Planning Phase

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Role Hierarchy & Taxonomy](#role-hierarchy--taxonomy)
4. [Permission Matrix](#permission-matrix)
5. [Data Scope Distribution Model](#data-scope-distribution-model)
6. [Backend Implementation Plan](#backend-implementation-plan)
7. [Frontend Implementation Plan](#frontend-implementation-plan)
8. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
9. [Migration Strategy](#migration-strategy)
10. [Testing & QA Strategy](#testing--qa-strategy)

---

## 🎯 Executive Summary

This roadmap outlines the implementation of a comprehensive **Role-Based Control & Distribution (RBCD)** framework for the RMS POS system. The framework will provide:

- **Granular Access Control**: Module, record, and field-level permissions
- **Multi-Scope Data Distribution**: Company, branch, warehouse, region, record, and field-level scoping
- **Dynamic UI Rendering**: Components automatically hide/disable based on permissions
- **Advanced Control Policies**: Time-based access, approval chains, conditional access, delegation
- **Compliance Ready**: ISO 27001, GDPR, SOC 2 audit trail support

**Estimated Timeline:** 8-10 weeks (phased approach)

---

## 🔍 Current State Analysis

### Existing Infrastructure

#### Backend

- ✅ **User Model**: Basic `role` (enum) and `permissions` (string array)
- ✅ **Auth Middleware**: `authenticate`, `authorize`, `requirePermission`
- ✅ **Current Roles**: `OWNER`, `ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN_STAFF`, `WAITER`, `INVENTORY_CLERK`
- ✅ **Multi-Tenant**: Master DB for users/tenants, tenant-specific DBs for data
- ✅ **JWT Authentication**: Token-based auth with tenant context

#### Frontend

- ✅ **Pages**: Dashboard, POS, Products, Inventory, Customers, Invoices, Payments, Reports, Settings, Users, etc.
- ✅ **Routes**: Protected routes with basic auth checks
- ❌ **No Permission-Based UI**: Components don't conditionally render based on permissions
- ❌ **No Role Management UI**: No admin interface for managing roles/permissions

#### Modules Identified

1. **POS** - Point of Sale transactions
2. **Products** - Product catalog management
3. **Inventory** - Stock management, adjustments, transfers
4. **Customers** - CRM and customer management
5. **Invoices** - Invoice creation, viewing, delivery
6. **Payments** - Payment processing, refunds
7. **Purchase Orders** - Procurement and vendor management
8. **Vendors** - Supplier management
9. **Reports** - Analytics and reporting
10. **Settings** - System configuration
11. **Store** - Multi-store management
12. **Users** - User management
13. **Audit** - Audit logs and compliance
14. **Notifications** - Communication preferences
15. **Categories** - Product categorization

---

## 👥 Role Hierarchy & Taxonomy

### RMS POS Role Structure (Aligned with Requirements)

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTIVE ROLES                           │
├─────────────────────────────────────────────────────────────┤
│ • Owner (System Owner)                                       │
│   └─ Full system access, cannot be restricted               │
│                                                              │
│ • CFO (Chief Financial Officer)                              │
│   └─ Financial data, reports, payment settings               │
│                                                              │
│ • COO (Chief Operating Officer)                              │
│   └─ Operations oversight, multi-store management           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                ADMINISTRATIVE ROLES                         │
├─────────────────────────────────────────────────────────────┤
│ • Super Admin                                                │
│   └─ Full tenant access, role/permission management         │
│                                                              │
│ • System Admin                                               │
│   └─ System settings, integrations, compliance               │
│                                                              │
│ • Department Admin                                           │
│   └─ Department-specific admin (e.g., Inventory Admin)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  OPERATIONAL ROLES                          │
├─────────────────────────────────────────────────────────────┤
│ • Store Manager                                              │
│   └─ Full store operations, staff management                 │
│                                                              │
│ • Inventory Manager                                           │
│   └─ Stock management, transfers, adjustments                │
│                                                              │
│ • Procurement Officer                                        │
│   └─ Purchase orders, vendor management                     │
│                                                              │
│ • Sales Executive                                            │
│   └─ Sales, customer management, CRM                         │
│                                                              │
│ • Finance Officer                                             │
│   └─ Invoices, payments, financial reports                   │
│                                                              │
│ • Cashier                                                    │
│   └─ POS transactions, basic operations                      │
│                                                              │
│ • Kitchen Staff                                              │
│   └─ Order fulfillment (restaurant mode)                     │
│                                                              │
│ • Waiter                                                      │
│   └─ Table service, order taking (restaurant mode)           │
│                                                              │
│ • Inventory Clerk                                            │
│   └─ Stock counting, basic inventory tasks                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SUPPORT ROLES                            │
├─────────────────────────────────────────────────────────────┤
│ • Customer Support Agent                                     │
│   └─ Customer inquiries, issue resolution                   │
│                                                              │
│ • Auditor                                                    │
│   └─ Read-only access to audit logs, compliance             │
│                                                              │
│ • Compliance Officer                                         │
│   └─ Compliance settings, audit review                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL / LIMITED ACCESS ROLES                │
├─────────────────────────────────────────────────────────────┤
│ • Vendor Portal User                                         │
│   └─ Vendor-specific portal access                           │
│                                                              │
│ • Partner                                                    │
│   └─ Limited integration access                              │
│                                                              │
│ • Guest                                                      │
│   └─ Public API access (if applicable)                       │
└─────────────────────────────────────────────────────────────┘
```

### Role Mapping (Current → New)

| Current Role      | New Role(s)       | Notes                         |
| ----------------- | ----------------- | ----------------------------- |
| `OWNER`           | `Owner`           | Unchanged, full access        |
| `ADMIN`           | `Super Admin`     | Enhanced with role management |
| `MANAGER`         | `Store Manager`   | Store-scoped operations       |
| `CASHIER`         | `Cashier`         | Unchanged                     |
| `KITCHEN_STAFF`   | `Kitchen Staff`   | Unchanged                     |
| `WAITER`          | `Waiter`          | Unchanged                     |
| `INVENTORY_CLERK` | `Inventory Clerk` | Unchanged                     |

**New Roles to Add:**

- `CFO`, `COO` (Executive)
- `System Admin`, `Department Admin` (Administrative)
- `Inventory Manager`, `Procurement Officer`, `Sales Executive`, `Finance Officer` (Operational)
- `Customer Support Agent`, `Auditor`, `Compliance Officer` (Support)
- `Vendor Portal User`, `Partner`, `Guest` (External)

---

## 📊 Permission Matrix

### Permission Format

**Pattern:** `{module}:{action}` or `{module}:{resource}:{action}`

**Examples:**

- `pos:create` - Create POS transactions
- `products:update` - Update products
- `inventory:adjustments:approve` - Approve inventory adjustments
- `settings:payments:update` - Update payment settings
- `reports:financial:view` - View financial reports

### Module-Action Mapping

| Module             | Actions                                                                                                                                        | Description              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **pos**            | `create`, `read`, `update`, `delete`, `refund`, `void`, `export`                                                                               | POS transactions         |
| **products**       | `create`, `read`, `update`, `delete`, `import`, `export`, `pricing:update`                                                                     | Product catalog          |
| **inventory**      | `read`, `adjust`, `transfer`, `receive`, `approve`, `export`                                                                                   | Stock management         |
| **customers**      | `create`, `read`, `update`, `delete`, `export`, `credit:manage`                                                                                | Customer management      |
| **invoices**       | `create`, `read`, `update`, `delete`, `send`, `export`, `approve`                                                                              | Invoice management       |
| **payments**       | `create`, `read`, `refund`, `void`, `export`, `settings:update`                                                                                | Payment processing       |
| **purchaseOrders** | `create`, `read`, `update`, `delete`, `approve`, `receive`, `export`                                                                           | Procurement              |
| **vendors**        | `create`, `read`, `update`, `delete`, `export`                                                                                                 | Vendor management        |
| **reports**        | `view`, `export`, `financial:view`, `sales:view`, `inventory:view`                                                                             | Reporting                |
| **settings**       | `read`, `update`, `store:update`, `business:update`, `tax:update`, `pos:update`, `payments:update`, `integrations:update`, `compliance:update` | System settings          |
| **store**          | `create`, `read`, `update`, `delete`, `switch`                                                                                                 | Multi-store management   |
| **users**          | `create`, `read`, `update`, `delete`, `roles:assign`, `suspend`                                                                                | User management          |
| **roles**          | `create`, `read`, `update`, `delete`, `permissions:manage`                                                                                     | Role management          |
| **audit**          | `read`, `export`, `compliance:view`                                                                                                            | Audit logs               |
| **notifications**  | `read`, `update`, `test`                                                                                                                       | Notification preferences |
| **categories**     | `create`, `read`, `update`, `delete`                                                                                                           | Product categories       |

### Role-Permission Matrix (Sample)

| Role                  | POS            | Products | Inventory      | Customers      | Invoices | Payments       | Reports      | Settings    | Users   | Roles  |
| --------------------- | -------------- | -------- | -------------- | -------------- | -------- | -------------- | ------------ | ----------- | ------- | ------ |
| **Owner**             | ✅ All         | ✅ All   | ✅ All         | ✅ All         | ✅ All   | ✅ All         | ✅ All       | ✅ All      | ✅ All  | ✅ All |
| **Super Admin**       | ✅ All         | ✅ All   | ✅ All         | ✅ All         | ✅ All   | ✅ All         | ✅ All       | ✅ All      | ✅ All  | ✅ All |
| **Store Manager**     | ✅ All         | ✅ CRUD  | ✅ Read/Adjust | ✅ CRUD        | ✅ CRUD  | ✅ Read/Refund | ✅ View      | ✅ Read     | ✅ Read | ❌     |
| **Inventory Manager** | ❌             | ✅ Read  | ✅ All         | ❌             | ❌       | ❌             | ✅ Inventory | ❌          | ❌      | ❌     |
| **Cashier**           | ✅ Create/Read | ✅ Read  | ✅ Read        | ✅ Read/Create | ✅ Read  | ✅ Create/Read | ❌           | ❌          | ❌      | ❌     |
| **Finance Officer**   | ❌             | ❌       | ❌             | ✅ Read        | ✅ All   | ✅ All         | ✅ Financial | ✅ Payments | ❌      | ❌     |
| **Auditor**           | ✅ Read        | ✅ Read  | ✅ Read        | ✅ Read        | ✅ Read  | ✅ Read        | ✅ Read      | ✅ Read     | ✅ Read | ❌     |

**Legend:**

- ✅ All = Full CRUD + workflow actions
- ✅ CRUD = Create, Read, Update, Delete
- ✅ Read = Read-only access
- ❌ = No access

### Field-Level Permissions

**Sensitive Fields** (require special permissions):

- `products.cost` - `products:pricing:view`
- `products.profitMargin` - `products:pricing:view`
- `users.salary` - `users:financial:view` (if applicable)
- `settings.payments.stripe.secretKey` - `settings:payments:secrets:view`
- `settings.integrations.*.secret` - `settings:integrations:secrets:view`

---

## 🌐 Data Scope Distribution Model

### Scope Types

| Scope Type    | Description                    | Example                     | Implementation                              |
| ------------- | ------------------------------ | --------------------------- | ------------------------------------------- |
| **Global**    | All tenants (Super Admin only) | System-wide access          | `scope: 'global'`                           |
| **Tenant**    | All data within tenant         | Default scope               | `scope: 'tenant'`                           |
| **Store**     | Specific store(s) only         | Store Manager (Store A)     | `scope: 'store', storeIds: ['store1']`      |
| **Warehouse** | Specific warehouse(s)          | Inventory Manager (WH-1)    | `scope: 'warehouse', warehouseIds: ['wh1']` |
| **Region**    | Geographic region              | Regional Manager            | `scope: 'region', regionIds: ['east']`      |
| **Record**    | Own or assigned records        | Sales Executive (own leads) | `scope: 'record', ownerId: userId`          |
| **Field**     | Field-level restrictions       | Hidden cost prices          | `scope: 'field', fields: ['cost']`          |

### Scope Assignment Model

```typescript
interface UserScope {
  type:
    | 'global'
    | 'tenant'
    | 'store'
    | 'warehouse'
    | 'region'
    | 'record'
    | 'field';
  ids?: string[]; // Store IDs, warehouse IDs, region IDs, etc.
  ownerId?: string; // For record-level scope
  fields?: string[]; // For field-level restrictions
  conditions?: {
    timeBased?: {start: string; end: string}; // Time-based access
    approvalRequired?: boolean; // Require approval for actions
  };
}
```

### Role-Scope Mapping

| Role              | Default Scope | Can Be Assigned To               |
| ----------------- | ------------- | -------------------------------- |
| Owner             | Tenant        | N/A (fixed)                      |
| Super Admin       | Tenant        | N/A (fixed)                      |
| Store Manager     | Store(s)      | Specific stores                  |
| Inventory Manager | Warehouse(s)  | Specific warehouses              |
| Cashier           | Store         | Single store (typically)         |
| Sales Executive   | Record        | Own records only                 |
| Finance Officer   | Tenant        | All stores (read-only financial) |
| Auditor           | Tenant        | Read-only, all data              |

---

## 🔧 Backend Implementation Plan

### Phase 1: Data Model & Schema Changes

#### 1.1 Role Model (`backend/src/models/role.model.ts`)

```typescript
interface IRole extends Document {
  tenantId: ObjectId;
  name: string; // e.g., "Store Manager"
  code: string; // e.g., "store_manager" (unique per tenant)
  description?: string;
  category:
    | 'executive'
    | 'administrative'
    | 'operational'
    | 'support'
    | 'external';
  isSystem: boolean; // System-defined roles cannot be deleted
  isDefault: boolean; // Default role for new users
  permissions: string[]; // Array of permission strings
  scope: {
    type: 'global' | 'tenant' | 'store' | 'warehouse' | 'region' | 'record';
    defaultIds?: string[]; // Default store/warehouse IDs
  };
  metadata?: {
    color?: string; // UI color for role badge
    icon?: string; // Icon identifier
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Changes:**

- ✅ Create new `Role` model in master DB (tenant-scoped)
- ✅ Add indexes: `{ tenantId: 1, code: 1 }` (unique)
- ✅ Seed default roles on tenant creation

#### 1.2 User Model Updates (`backend/src/models/user.model.ts`)

```typescript
interface IUser extends Document {
  // ... existing fields ...
  role: string; // Keep for backward compatibility (role code)
  roles: ObjectId[]; // NEW: Array of role IDs (multi-role support)
  permissions: string[]; // Computed from roles
  scope: UserScope; // NEW: Data access scope
  delegatedFrom?: ObjectId; // NEW: If role is delegated
  delegatedUntil?: Date; // NEW: Delegation expiry
  // ... rest of fields ...
}
```

**Changes:**

- ✅ Add `roles` array (multi-role support)
- ✅ Add `scope` object (data access boundaries)
- ✅ Add `delegatedFrom` and `delegatedUntil` (delegation support)
- ✅ Update `permissions` to be computed from roles (not stored directly)
- ✅ Migration script to convert existing `role` enum to role codes

#### 1.3 Permission Model (`backend/src/models/permission.model.ts`)

```typescript
interface IPermission extends Document {
  module: string; // e.g., "pos", "products"
  action: string; // e.g., "create", "read", "update"
  resource?: string; // e.g., "adjustments" (for inventory:adjustments:approve)
  description: string;
  category: 'crud' | 'workflow' | 'data' | 'system';
  isSensitive: boolean; // Requires additional audit logging
}
```

**Changes:**

- ✅ Create permission registry (can be static or DB-backed)
- ✅ Define all module-action combinations
- ✅ Add permission validation utilities

#### 1.4 Role Assignment Model (`backend/src/models/roleAssignment.model.ts`)

```typescript
interface IRoleAssignment extends Document {
  tenantId: ObjectId;
  userId: ObjectId;
  roleId: ObjectId;
  assignedBy: ObjectId;
  assignedAt: Date;
  expiresAt?: Date; // Time-bound assignment
  scope: UserScope; // Override default role scope
  isActive: boolean;
}
```

**Changes:**

- ✅ Track role assignments separately (for audit)
- ✅ Support time-bound assignments
- ✅ Support scope overrides per assignment

### Phase 2: Services & Business Logic

#### 2.1 Role Service (`backend/src/services/role.service.ts`)

**Methods:**

- `createRole(tenantId, data)` - Create custom role
- `updateRole(tenantId, roleId, data)` - Update role
- `deleteRole(tenantId, roleId)` - Delete role (if not system)
- `getRoles(tenantId, filters)` - List roles
- `getRole(tenantId, roleId)` - Get role details
- `assignRole(tenantId, userId, roleId, scope?)` - Assign role to user
- `revokeRole(tenantId, userId, roleId)` - Revoke role
- `getUserRoles(tenantId, userId)` - Get user's roles
- `computeUserPermissions(tenantId, userId)` - Compute permissions from roles
- `validatePermission(permission)` - Validate permission string format

**Changes:**

- ✅ Create new service
- ✅ Implement CRUD operations
- ✅ Implement permission computation logic
- ✅ Add validation and business rules

#### 2.2 Permission Service (`backend/src/services/permission.service.ts`)

**Methods:**

- `getAllPermissions()` - Get permission registry
- `getPermissionsByModule(module)` - Get permissions for a module
- `validatePermission(permission)` - Validate permission format
- `checkPermission(userPermissions, requiredPermission)` - Check if user has permission
- `expandWildcardPermissions(permissions)` - Expand `*` wildcards

**Changes:**

- ✅ Create permission registry
- ✅ Implement permission checking utilities
- ✅ Support wildcard permissions (`products:*`)

#### 2.3 Scope Service (`backend/src/services/scope.service.ts`)

**Methods:**

- `applyScopeFilter(query, userScope, resourceType)` - Apply scope to MongoDB query
- `checkRecordAccess(userScope, record, resourceType)` - Check if user can access record
- `getAccessibleStoreIds(userScope)` - Get accessible store IDs
- `getAccessibleWarehouseIds(userScope)` - Get accessible warehouse IDs
- `validateScope(scope)` - Validate scope object

**Changes:**

- ✅ Create scope filtering utilities
- ✅ Implement query builders with scope filters
- ✅ Add record-level access checks

### Phase 3: Middleware & Authorization

#### 3.1 Enhanced Auth Middleware (`backend/src/middleware/auth.middleware.ts`)

**Changes:**

- ✅ Update `authenticate` to load user roles and compute permissions
- ✅ Attach computed permissions to `req.user.permissions`
- ✅ Attach scope to `req.user.scope`

#### 3.2 Permission Middleware (`backend/src/middleware/permission.middleware.ts`)

**New Middleware:**

```typescript
export const requirePermission = (permission: string | string[]) => {
  // Check if user has required permission(s)
};

export const requireAnyPermission = (permissions: string[]) => {
  // Check if user has at least one permission
};

export const requireAllPermissions = (permissions: string[]) => {
  // Check if user has all permissions
};

export const requireModuleAccess = (module: string) => {
  // Check if user has any access to module
};
```

**Changes:**

- ✅ Create new permission middleware
- ✅ Support single/multiple permission checks
- ✅ Support wildcard matching
- ✅ Add detailed error messages

#### 3.3 Scope Middleware (`backend/src/middleware/scope.middleware.ts`)

**New Middleware:**

```typescript
export const applyScope = (resourceType: string) => {
  // Automatically apply scope filters to queries
};

export const checkRecordScope = (recordId: string, resourceType: string) => {
  // Check if user can access specific record
};
```

**Changes:**

- ✅ Create scope filtering middleware
- ✅ Integrate with query builders
- ✅ Add record-level access checks

#### 3.4 Time-Based Access Middleware (`backend/src/middleware/timeAccess.middleware.ts`)

**New Middleware:**

```typescript
export const checkTimeAccess = (allowedHours?: {
  start: string;
  end: string;
}) => {
  // Check if current time is within allowed hours
};
```

**Changes:**

- ✅ Create time-based access checks
- ✅ Support timezone-aware validation

### Phase 4: Route Protection

#### 4.1 Update All Routes

**Pattern:**

```typescript
router.post(
  '/products',
  authenticate,
  requirePermission('products:create'),
  applyScope('products'),
  productController.create
);
```

**Routes to Update:**

- ✅ `pos.routes.ts` - Add permission checks
- ✅ `product.routes.ts` - Add permission checks
- ✅ `inventory.routes.ts` - Add permission checks
- ✅ `customer.routes.ts` - Add permission checks
- ✅ `invoice.routes.ts` - Add permission checks
- ✅ `payment.routes.ts` - Add permission checks
- ✅ `purchaseOrder.routes.ts` - Add permission checks
- ✅ `vendor.routes.ts` - Add permission checks
- ✅ `reports.routes.ts` - Add permission checks
- ✅ `settings.routes.ts` - Add granular permission checks
- ✅ `store.routes.ts` - Add permission checks
- ✅ `user.routes.ts` - Add permission checks
- ✅ `audit.routes.ts` - Add permission checks

**Changes:**

- ✅ Replace `authorize()` with `requirePermission()`
- ✅ Add scope middleware where applicable
- ✅ Add field-level permission checks for sensitive endpoints

### Phase 5: Controllers & Services Updates

#### 5.1 Update All Controllers

**Pattern:**

```typescript
export class ProductController {
  create = asyncHandler(async (req: TenantRequest, res: Response) => {
    // Scope is automatically applied via middleware
    // Additional record-level checks if needed
    const product = await productService.create(
      req.user!.tenantId,
      req.body,
      req.user!.id
    );
    sendSuccess(res, product);
  });
}
```

**Changes:**

- ✅ Update all controllers to use `req.user.scope`
- ✅ Add record-level access checks where needed
- ✅ Filter responses based on field-level permissions

#### 5.2 Update All Services

**Pattern:**

```typescript
export class ProductService {
  async list(
    tenantId: string,
    userId: string,
    filters: any,
    userScope: UserScope
  ) {
    const query = {tenantId};
    // Apply scope filters
    if (userScope.type === 'store') {
      query.storeId = {$in: userScope.ids};
    }
    // ... rest of logic
  }
}
```

**Changes:**

- ✅ Update all service methods to accept `userScope`
- ✅ Apply scope filters to queries
- ✅ Add record-level access checks
- ✅ Filter sensitive fields based on permissions

### Phase 6: API Endpoints

#### 6.1 Role Management APIs

**New Routes:** `backend/src/routes/role.routes.ts`

```
GET    /api/roles                    - List all roles
GET    /api/roles/:id                - Get role details
POST   /api/roles                   - Create role (Super Admin only)
PUT    /api/roles/:id               - Update role
DELETE /api/roles/:id               - Delete role
GET    /api/roles/:id/permissions   - Get role permissions
PUT    /api/roles/:id/permissions   - Update role permissions
POST   /api/roles/:id/assign       - Assign role to user
DELETE /api/roles/:id/assign       - Revoke role from user
GET    /api/users/:id/roles         - Get user's roles
GET    /api/permissions             - Get permission registry
```

**Changes:**

- ✅ Create role routes
- ✅ Create role controller
- ✅ Add validation middleware
- ✅ Add audit logging

#### 6.2 Permission APIs

**New Routes:** `backend/src/routes/permission.routes.ts`

```
GET    /api/permissions             - Get all permissions
GET    /api/permissions/modules     - Get permissions by module
GET    /api/permissions/validate    - Validate permission string
GET    /api/users/:id/permissions   - Get user's computed permissions
```

**Changes:**

- ✅ Create permission routes
- ✅ Create permission controller

### Phase 7: Audit & Compliance

#### 7.1 Enhanced Audit Logging

**Changes:**

- ✅ Update audit middleware to log:
  - Role used for action
  - Permission used
  - Scope applied
  - Delegation info (if applicable)
- ✅ Add permission denial logging
- ✅ Add scope violation logging

#### 7.2 Compliance Features

**Changes:**

- ✅ Add role change audit trail
- ✅ Add permission assignment audit trail
- ✅ Add scope change audit trail
- ✅ Add delegation audit trail

---

## 🎨 Frontend Implementation Plan

### Phase 1: Permission System & Hooks

#### 1.1 Permission Types (`frontend/src/types/permissions.types.ts`)

```typescript
export interface Permission {
  module: string;
  action: string;
  resource?: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  category:
    | 'executive'
    | 'administrative'
    | 'operational'
    | 'support'
    | 'external';
  permissions: string[];
  scope: UserScope;
}

export interface UserScope {
  type: 'global' | 'tenant' | 'store' | 'warehouse' | 'region' | 'record';
  ids?: string[];
  ownerId?: string;
  fields?: string[];
}
```

**Changes:**

- ✅ Create permission type definitions
- ✅ Create role type definitions
- ✅ Create scope type definitions

#### 1.2 Permission Service (`frontend/src/services/permission.service.ts`)

**Methods:**

- `hasPermission(permission: string)` - Check if user has permission
- `hasAnyPermission(permissions: string[])` - Check if user has any permission
- `hasAllPermissions(permissions: string[])` - Check if user has all permissions
- `hasModuleAccess(module: string)` - Check if user has module access
- `canAccessField(field: string, resource: string)` - Check field-level access

**Changes:**

- ✅ Create permission checking utilities
- ✅ Integrate with user context/store

#### 1.3 Permission Hooks (`frontend/src/hooks/usePermissions.ts`)

```typescript
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    // Check permission
  };

  const hasAnyPermission = (permissions: string[]) => {
    // Check any permission
  };

  const hasModuleAccess = (module: string) => {
    // Check module access
  };

  return { hasPermission, hasAnyPermission, hasModuleAccess, ... };
};
```

**Changes:**

- ✅ Create React hooks for permissions
- ✅ Integrate with user context
- ✅ Add memoization for performance

#### 1.4 Scope Hooks (`frontend/src/hooks/useScope.ts`)

```typescript
export const useScope = () => {
  const { user } = useAuth();

  const getAccessibleStores = () => {
    // Get accessible store IDs
  };

  const canAccessStore = (storeId: string) => {
    // Check store access
  };

  return { getAccessibleStores, canAccessStore, ... };
};
```

**Changes:**

- ✅ Create scope utility hooks
- ✅ Integrate with store context

### Phase 2: Route Protection

#### 2.1 Permission Guard Component (`frontend/src/components/auth/PermissionGuard.tsx`)

```typescript
interface PermissionGuardProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback,
  children,
}) => {
  const {hasPermission, hasAnyPermission} = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (!hasAccess) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
};
```

**Changes:**

- ✅ Create permission guard component
- ✅ Support single/multiple permissions
- ✅ Add access denied fallback

#### 2.2 Module Guard Component (`frontend/src/components/auth/ModuleGuard.tsx`)

```typescript
interface ModuleGuardProps {
  module: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
  module,
  fallback,
  children,
}) => {
  const {hasModuleAccess} = usePermissions();

  if (!hasModuleAccess(module)) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
};
```

**Changes:**

- ✅ Create module guard component
- ✅ Hide entire modules if no access

#### 2.3 Update Route Configuration (`frontend/src/routes/index.tsx`)

**Pattern:**

```typescript
<Route
  path="/products"
  element={
    <ModuleGuard module="products">
      <ProductsPage />
    </ModuleGuard>
  }
/>
```

**Changes:**

- ✅ Wrap all routes with `ModuleGuard`
- ✅ Add permission checks to nested routes
- ✅ Add redirect to access denied page

### Phase 3: UI Component Updates

#### 3.1 Conditional Button Rendering

**Pattern:**

```typescript
const ProductsPage = () => {
  const {hasPermission} = usePermissions();

  return (
    <div>
      {hasPermission('products:create') && (
        <Button onClick={handleCreate}>Add Product</Button>
      )}
      {hasPermission('products:update') && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
      {hasPermission('products:delete') && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
};
```

**Components to Update:**

- ✅ `ProductsPage.tsx`
- ✅ `InventoryPage.tsx`
- ✅ `CustomersPage.tsx`
- ✅ `InvoicesPage.tsx`
- ✅ `PaymentsPage.tsx`
- ✅ `PurchaseOrdersPage.tsx`
- ✅ `VendorsPage.tsx`
- ✅ `ReportsPage.tsx`
- ✅ `SettingsPage.tsx`
- ✅ `UsersPage.tsx`
- ✅ `POSPage.tsx`

**Changes:**

- ✅ Add permission checks to all action buttons
- ✅ Hide/disable buttons based on permissions
- ✅ Add tooltips for disabled buttons

#### 3.2 Conditional Field Rendering

**Pattern:**

```typescript
const ProductForm = () => {
  const {canAccessField} = usePermissions();

  return (
    <form>
      <Input name="name" label="Product Name" />
      <Input name="price" label="Price" />
      {canAccessField('cost', 'products') && (
        <Input name="cost" label="Cost Price" />
      )}
    </form>
  );
};
```

**Changes:**

- ✅ Add field-level permission checks
- ✅ Hide sensitive fields (cost, profit margin, etc.)
- ✅ Mask sensitive data in tables

#### 3.3 Conditional Tab Rendering

**Pattern:**

```typescript
const SettingsPage = () => {
  const {hasModuleAccess} = usePermissions();

  const tabs = [
    {id: 'store', permission: 'settings:store:read'},
    {id: 'payments', permission: 'settings:payments:read'},
    // ...
  ].filter((tab) => hasPermission(tab.permission));

  return <Tabs tabs={tabs} />;
};
```

**Changes:**

- ✅ Filter tabs based on permissions
- ✅ Hide entire sections if no access
- ✅ Update navigation menu

#### 3.4 Navigation Menu Updates (`frontend/src/components/layout/Sidebar.tsx`)

**Changes:**

- ✅ Filter menu items based on module access
- ✅ Hide menu items for unauthorized modules
- ✅ Add role badges/indicators
- ✅ Add permission-based sub-menu items

### Phase 4: Role Management UI

#### 4.1 Roles Page (`frontend/src/pages/RolesPage.tsx`)

**Features:**

- List all roles
- Create/edit/delete roles
- Assign permissions to roles
- Assign roles to users
- View role details
- Role usage statistics

**Changes:**

- ✅ Create new page
- ✅ Create role list component
- ✅ Create role form component
- ✅ Create permission selector component
- ✅ Create role assignment component

#### 4.2 Role Form Component (`frontend/src/components/roles/RoleForm.tsx`)

**Features:**

- Role name, code, description
- Permission selector (tree view)
- Scope configuration
- Role category selection

**Changes:**

- ✅ Create form component
- ✅ Add permission tree selector
- ✅ Add scope configuration UI
- ✅ Add validation

#### 4.3 Permission Selector (`frontend/src/components/roles/PermissionSelector.tsx`)

**Features:**

- Tree view of modules → actions
- Checkbox selection
- Search/filter permissions
- Bulk select by module

**Changes:**

- ✅ Create tree component
- ✅ Add search functionality
- ✅ Add bulk selection
- ✅ Add permission descriptions

#### 4.4 User Role Assignment (`frontend/src/components/users/UserRoleAssignment.tsx`)

**Features:**

- Assign multiple roles to user
- Set scope overrides
- Time-bound assignments
- Delegation support

**Changes:**

- ✅ Create assignment component
- ✅ Add scope override UI
- ✅ Add time-bound assignment UI
- ✅ Add delegation UI

### Phase 5: User Management Updates

#### 5.1 Users Page Updates (`frontend/src/pages/UsersPage.tsx`)

**Changes:**

- ✅ Add role column
- ✅ Add role assignment button
- ✅ Add permission preview
- ✅ Add scope display
- ✅ Filter by role

#### 5.2 User Form Updates (`frontend/src/components/users/UserForm.tsx`)

**Changes:**

- ✅ Add role selector
- ✅ Add scope configuration
- ✅ Add permission preview
- ✅ Remove direct permission editing (use roles instead)

### Phase 6: Data Filtering & Scope

#### 6.1 Store Selector Updates

**Changes:**

- ✅ Filter stores based on user scope
- ✅ Show only accessible stores
- ✅ Add scope indicator

#### 6.2 Table/List Filtering

**Changes:**

- ✅ Automatically filter data based on scope
- ✅ Add scope indicators in tables
- ✅ Add scope filters to search

#### 6.3 Dashboard Updates (`frontend/src/pages/DashboardPage.tsx`)

**Changes:**

- ✅ Filter widgets based on permissions
- ✅ Filter data based on scope
- ✅ Show only accessible metrics
- ✅ Add permission-based widget visibility

### Phase 7: Access Denied & Error Handling

#### 7.1 Access Denied Page (`frontend/src/pages/AccessDeniedPage.tsx`)

**Features:**

- Clear error message
- Required permission display
- Contact admin option
- Request access button

**Changes:**

- ✅ Create access denied page
- ✅ Add helpful messaging
- ✅ Add request access flow

#### 7.2 Error Handling Updates

**Changes:**

- ✅ Handle 403 (Forbidden) errors
- ✅ Show permission-specific error messages
- ✅ Add retry/request access options

---

## 📅 Phase-by-Phase Implementation

### Phase 1: Foundation (Weeks 1-2)

**Backend:**

- ✅ Create Role model and schema
- ✅ Create Permission model/registry
- ✅ Update User model (add roles, scope)
- ✅ Create Role service
- ✅ Create Permission service
- ✅ Create Scope service
- ✅ Seed default roles

**Frontend:**

- ✅ Create permission types
- ✅ Create permission service
- ✅ Create permission hooks
- ✅ Update user context/store

**Deliverable:** Role and permission system foundation

---

### Phase 2: Authorization Middleware (Week 3)

**Backend:**

- ✅ Update auth middleware (load roles, compute permissions)
- ✅ Create permission middleware
- ✅ Create scope middleware
- ✅ Update all routes with permission checks
- ✅ Add audit logging for permissions

**Frontend:**

- ✅ Create PermissionGuard component
- ✅ Create ModuleGuard component
- ✅ Update route configuration

**Deliverable:** Route-level authorization

---

### Phase 3: Service & Controller Updates (Week 4)

**Backend:**

- ✅ Update all services to accept userScope
- ✅ Apply scope filters to queries
- ✅ Add record-level access checks
- ✅ Filter sensitive fields
- ✅ Update all controllers

**Frontend:**

- ✅ Update all pages with permission checks
- ✅ Add conditional button rendering
- ✅ Add conditional field rendering
- ✅ Update navigation menu

**Deliverable:** Service-level authorization and UI updates

---

### Phase 4: Role Management UI (Week 5)

**Backend:**

- ✅ Create role routes and controller
- ✅ Create permission routes and controller
- ✅ Add role assignment APIs
- ✅ Add validation

**Frontend:**

- ✅ Create RolesPage
- ✅ Create RoleForm component
- ✅ Create PermissionSelector component
- ✅ Create UserRoleAssignment component
- ✅ Update UsersPage

**Deliverable:** Role management interface

---

### Phase 5: Advanced Features (Week 6)

**Backend:**

- ✅ Time-based access middleware
- ✅ Delegation support
- ✅ Approval chain integration
- ✅ Enhanced audit logging

**Frontend:**

- ✅ Time-based access UI
- ✅ Delegation UI
- ✅ Approval workflow UI
- ✅ Enhanced audit log views

**Deliverable:** Advanced control policies

---

### Phase 6: Data Scope & Filtering (Week 7)

**Backend:**

- ✅ Store-level scope filtering
- ✅ Warehouse-level scope filtering
- ✅ Record-level access checks
- ✅ Field-level permission checks

**Frontend:**

- ✅ Scope-based store filtering
- ✅ Scope-based data filtering
- ✅ Scope indicators
- ✅ Field masking

**Deliverable:** Complete scope implementation

---

### Phase 7: Testing & QA (Week 8)

**Backend:**

- ✅ Unit tests for services
- ✅ Integration tests for APIs
- ✅ Permission test suite
- ✅ Scope test suite

**Frontend:**

- ✅ Component tests
- ✅ Permission hook tests
- ✅ E2E tests for role management
- ✅ E2E tests for permission checks

**Deliverable:** Test coverage and QA

---

### Phase 8: Migration & Deployment (Week 9-10)

**Backend:**

- ✅ Migration script (convert existing roles)
- ✅ Data migration (assign default roles)
- ✅ Backward compatibility layer
- ✅ Documentation

**Frontend:**

- ✅ Migration guide
- ✅ User training materials
- ✅ Admin documentation

**Deliverable:** Production-ready RBAC system

---

## 🔄 Migration Strategy

### Step 1: Data Migration

**Script:** `backend/src/migrations/migrateToRBAC.ts`

**Tasks:**

1. Create default roles in master DB for each tenant
2. Map existing `user.role` enum to new role codes
3. Assign default role to each user
4. Compute and store permissions (for backward compatibility)
5. Set default scope (tenant-level for most users)

**Rollback Plan:**

- Keep `user.role` field during migration
- Add feature flag `RBAC_ENABLED`
- Can revert to old system if needed

### Step 2: Gradual Rollout

**Phase A:**

- Enable RBAC for new tenants only
- Existing tenants use old system

**Phase B:**

- Migrate existing tenants one by one
- Monitor for issues

**Phase C:**

- Full rollout
- Remove old system after validation period

### Step 3: Backward Compatibility

**Maintain:**

- `user.role` field (for compatibility)
- Old `authorize()` middleware (deprecated but functional)
- Permission computation from roles

**Deprecation Timeline:**

- Week 1-4: Both systems active
- Week 5-8: Old system deprecated (warnings)
- Week 9+: Old system removed

---

## 🧪 Testing & QA Strategy

### Unit Tests

**Backend:**

- ✅ Role service tests
- ✅ Permission service tests
- ✅ Scope service tests
- ✅ Permission middleware tests
- ✅ Scope middleware tests

**Frontend:**

- ✅ Permission hook tests
- ✅ Permission guard tests
- ✅ Permission service tests

### Integration Tests

**Backend:**

- ✅ Role CRUD API tests
- ✅ Permission checking tests
- ✅ Scope filtering tests
- ✅ Route protection tests

**Frontend:**

- ✅ Role management flow tests
- ✅ Permission-based UI tests
- ✅ Scope filtering tests

### E2E Tests

**Scenarios:**

1. Owner can access everything
2. Cashier can only create POS transactions
3. Inventory Manager can only access inventory
4. Store Manager can manage assigned stores only
5. Role assignment and revocation
6. Permission denial handling
7. Scope filtering works correctly

### Security Tests

- ✅ Permission bypass attempts
- ✅ Scope escalation attempts
- ✅ Role privilege escalation
- ✅ Unauthorized access attempts

---

## 📝 Documentation Requirements

### Developer Documentation

1. **RBAC Architecture Guide** (`docs/RBAC_ARCHITECTURE.md`)

   - System design
   - Permission format
   - Scope model
   - Middleware usage

2. **API Documentation** (`docs/RBAC_API.md`)

   - Role management APIs
   - Permission APIs
   - Usage examples

3. **Frontend Guide** (`docs/RBAC_FRONTEND.md`)
   - Permission hooks usage
   - Guard components
   - UI conditional rendering

### Admin Documentation

1. **Role Management Guide** (`docs/ADMIN_ROLE_MANAGEMENT.md`)

   - How to create roles
   - How to assign permissions
   - How to assign roles to users
   - Scope configuration

2. **Permission Reference** (`docs/PERMISSION_REFERENCE.md`)
   - All available permissions
   - Module-action matrix
   - Field-level permissions

### User Documentation

1. **User Guide** (`docs/USER_RBAC_GUIDE.md`)
   - What are roles?
   - What can I access?
   - How to request access?

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ All routes protected with permissions
- ✅ All UI components conditionally render
- ✅ Data filtered by scope
- ✅ Role management UI functional
- ✅ Permission system working end-to-end

### Performance Requirements

- ✅ Permission checks < 10ms
- ✅ Scope filtering < 50ms
- ✅ Role computation < 100ms
- ✅ No significant impact on API response times

### Security Requirements

- ✅ No permission bypasses
- ✅ No scope escalations
- ✅ All actions audited
- ✅ Compliance requirements met

### UX Requirements

- ✅ Clear access denied messages
- ✅ Intuitive role management
- ✅ Helpful permission tooltips
- ✅ Smooth permission-based UI transitions

---

## 📊 Estimated Effort

| Phase                       | Backend (Days) | Frontend (Days) | Total (Days)            |
| --------------------------- | -------------- | --------------- | ----------------------- |
| Phase 1: Foundation         | 5              | 3               | 8                       |
| Phase 2: Authorization      | 4              | 2               | 6                       |
| Phase 3: Services & UI      | 6              | 5               | 11                      |
| Phase 4: Role Management UI | 3              | 5               | 8                       |
| Phase 5: Advanced Features  | 4              | 3               | 7                       |
| Phase 6: Data Scope         | 4              | 3               | 7                       |
| Phase 7: Testing & QA       | 5              | 4               | 9                       |
| Phase 8: Migration          | 3              | 2               | 5                       |
| **Total**                   | **34**         | **27**          | **61 days (~12 weeks)** |

---

## 🚀 Next Steps

1. **Review & Approval**: Review this roadmap with stakeholders
2. **Resource Allocation**: Assign developers to phases
3. **Kickoff Meeting**: Align team on implementation approach
4. **Start Phase 1**: Begin foundation work

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-13  
**Status:** Ready for Review
