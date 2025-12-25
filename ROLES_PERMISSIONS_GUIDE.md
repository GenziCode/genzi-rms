# Roles & Permissions System - Complete Integration Guide

## 🎯 Overview

This document provides a complete guide to the Roles & Permissions system, ensuring 100% functionality and proper integration between frontend and backend.

## 📋 System Architecture

### Backend Components

1. **Models**
   - `role.model.ts` - Role schema with permissions and scope
   - `roleAssignment.model.ts` - User-role assignments
   - `permission.model.ts` - Permission definitions

2. **Services**
   - `role.service.ts` - Role CRUD operations and initialization
   - `permission.service.ts` - Permission management

3. **Controllers**
   - `role.controller.ts` - HTTP request handlers
   - `permission.routes.ts` - Permission endpoints

4. **Routes**
   - `role.routes.ts` - Role API endpoints with auth middleware

### Frontend Components

1. **Services**
   - `roles.service.ts` - API client for roles
   - `permissions.service.ts` - API client for permissions

2. **Pages**
   - `RolesPermissionsPage.tsx` - Main management interface

3. **Components**
   - `RoleFormModal.tsx` - Create/edit role modal
   - `PermissionSelector.tsx` - Permission selection UI
   - `PermissionMatrix.tsx` - Visual permission matrix
   - `UserRoleAssignment.tsx` - Assign roles to users

## 🔌 API Endpoints

### Roles

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/roles` | Get all roles | ✅ role:read |
| GET | `/api/roles/:id` | Get role by ID | ✅ role:read |
| POST | `/api/roles` | Create new role | ✅ role:create |
| PUT | `/api/roles/:id` | Update role | ✅ role:update |
| DELETE | `/api/roles/:id` | Delete role | ✅ role:delete |
| GET | `/api/roles/analytics` | Get role analytics | ✅ role:read |
| GET | `/api/roles/distribution` | Get role distribution | ✅ role:read |
| GET | `/api/roles/built-in` | Get system roles | ✅ role:read |
| POST | `/api/roles/initialize` | Initialize default roles | ✅ role:create |

### Permissions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/permissions` | Get all permissions | ✅ |
| GET | `/api/permissions/module/:module` | Get permissions by module | ✅ |
| GET | `/api/permissions/grouped` | Get permissions grouped by module | ✅ |

### User Role Assignments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/:userId/roles` | Assign role to user | ✅ role:create |
| DELETE | `/api/users/:userId/roles/:roleId` | Remove role from user | ✅ role:delete |
| GET | `/api/users/:userId/roles` | Get user's roles | ✅ role:read |

## 🔐 Default System Roles

### 1. Owner
- **Code**: `owner`
- **Permissions**: All permissions (*)
- **Scope**: Global
- **Description**: Full system access, all permissions

### 2. Administrator
- **Code**: `admin`
- **Permissions**: 
  - user:*, role:*, tenant:read, tenant:update
  - settings:*, product:*, customer:*, vendor:*
  - store:*, category:*, inventory:*
  - purchaseOrder:*, invoice:*, payment:*
  - pos:*, report:*
- **Scope**: Global
- **Description**: Administrative access, can manage users and settings

### 3. Manager
- **Code**: `manager`
- **Permissions**:
  - product:*, customer:*, vendor:*
  - store:read, category:*, inventory:*
  - purchaseOrder:*, invoice:*, payment:*
  - pos:*, report:*, user:read, settings:read
- **Scope**: Global or Store-specific
- **Description**: Management access, can manage operations

### 4. Cashier
- **Code**: `cashier`
- **Permissions**:
  - pos:*, product:read
  - customer:read, customer:create
  - invoice:read, invoice:create, invoice:print
  - payment:create, payment:read
- **Scope**: Store-specific
- **Description**: POS and sales access

### 5. Inventory Clerk
- **Code**: `inventory_clerk`
- **Permissions**:
  - inventory:*, product:read, product:update
  - purchaseOrder:read, store:read
- **Scope**: Store-specific
- **Description**: Inventory management access

## 🚀 Frontend Integration

### 1. Initialize Roles on First Load

```typescript
// In your app initialization or setup
import { rolesService } from '@/services/roles.service';

async function initializeApp() {
  try {
    // Check if roles exist
    const { roles } = await rolesService.getAll();
    
    if (roles.length === 0) {
      // Initialize default roles
      await rolesService.initializeDefaultRoles();
      console.log('✅ Default roles initialized');
    }
  } catch (error) {
    console.error('Failed to initialize roles:', error);
  }
}
```

### 2. Using the Roles Service

```typescript
import { rolesService } from '@/services/roles.service';

// Get all roles
const { roles } = await rolesService.getAll();

// Create a custom role
const { role } = await rolesService.create({
  name: 'Store Supervisor',
  code: 'STORE_SUPERVISOR',
  description: 'Supervises store operations',
  category: 'custom',
  permissionCodes: ['product:read', 'inventory:read', 'pos:read'],
  scope: { type: 'store' }
});

// Update a role
await rolesService.update(roleId, {
  description: 'Updated description',
  permissionCodes: ['product:read', 'product:update']
});

// Delete a role
await rolesService.delete(roleId);

// Assign role to user
await rolesService.assignRoleToUser(userId, roleId);
```

### 3. Using Permissions

```typescript
import { permissionsService } from '@/services/permissions.service';

// Get all permissions
const { permissions } = await permissionsService.getAll();

// Get permissions grouped by module
const grouped = await permissionsService.getGroupedByModule();
// Returns: { product: [...], customer: [...], inventory: [...] }

// Get permissions for a specific module
const { permissions: productPerms } = await permissionsService.getByModule('product');
```

### 4. Permission Checking

```typescript
import { useHasPermission } from '@/hooks/usePermissions';

function MyComponent() {
  const canCreateProduct = useHasPermission('product:create');
  const canDeleteInvoice = useHasPermission('invoice:delete');
  
  return (
    <div>
      {canCreateProduct && <button>Create Product</button>}
      {canDeleteInvoice && <button>Delete Invoice</button>}
    </div>
  );
}
```

## 🔒 Security Best Practices

### 1. Zero Trust Principles

- **Least Privilege**: Only grant minimum required permissions
- **Scope Limitation**: Restrict data access by store/department when possible
- **Regular Audits**: Review role assignments periodically
- **Time-based Access**: Use `expiresAt` for temporary role assignments

### 2. Permission Naming Convention

Format: `module:action`

Examples:
- `product:read` - View products
- `product:create` - Create products
- `product:update` - Update products
- `product:delete` - Delete products
- `product:*` - All product permissions
- `*` - All permissions (use with extreme caution)

### 3. Role Hierarchy

```
Owner (*)
  └─ Administrator (most permissions)
      └─ Manager (operational permissions)
          ├─ Cashier (POS permissions)
          └─ Inventory Clerk (inventory permissions)
```

## 🧪 Testing

### Run API Tests

```bash
cd backend
node test-roles-api.js
```

### Manual Testing Checklist

- [ ] Initialize default roles
- [ ] Create custom role with permissions
- [ ] Update role permissions
- [ ] Delete custom role (system roles should be protected)
- [ ] Assign role to user
- [ ] Remove role from user
- [ ] Verify permission checking works
- [ ] Test scope restrictions (store-level access)
- [ ] Verify role expiration works
- [ ] Test permission matrix view

## 🐛 Troubleshooting

### Issue: "Copy is not defined" error

**Solution**: Ensure `Copy` and `Globe` icons are imported in `RolesPermissionsPage.tsx`:

```typescript
import {
  // ... other imports
  Copy,
  Globe,
} from 'lucide-react';
```

### Issue: Permissions tab not showing content

**Solution**: Check that `permissionsData` is properly loaded before rendering:

```typescript
{permissionsLoading ? (
  <Spinner />
) : permissionsError ? (
  <div>Error loading permissions</div>
) : (
  <PermissionSelector
    permissions={permissionsData || {}}
    selectedPermissions={formData.permissionCodes || []}
    onChange={(perms) => setFormData({ ...formData, permissionCodes: perms })}
  />
)}
```

### Issue: Cannot delete system roles

**Solution**: This is by design. System roles are protected. Only custom roles can be deleted.

### Issue: Role initialization fails

**Solution**: Ensure:
1. User has `role:create` permission
2. Permissions are seeded in the database
3. Tenant context is properly set

## 📊 Monitoring & Analytics

### Get Role Analytics

```typescript
const analytics = await rolesService.getAnalytics();
// Returns:
// {
//   totalRoles: 6,
//   activeRoles: 6,
//   systemRoles: 5,
//   customRoles: 1
// }
```

### Get Role Distribution

```typescript
const { distribution } = await rolesService.getDistribution();
// Returns:
// {
//   system: 5,
//   custom: 1
// }
```

## 🔄 Migration Guide

If upgrading from a previous version:

1. **Backup existing roles**
   ```bash
   mongodump --db your_db --collection roles
   ```

2. **Run initialization**
   ```typescript
   await rolesService.initializeDefaultRoles();
   ```

3. **Migrate custom roles**
   - Review existing custom roles
   - Update permission codes to new format
   - Set appropriate scopes

4. **Update user assignments**
   - Verify all users have roles assigned
   - Update role assignments as needed

## 📝 Change Log

### Version 1.0.0 (Current)
- ✅ Complete RBAC system implementation
- ✅ Default system roles (Owner, Admin, Manager, Cashier, Inventory Clerk)
- ✅ Permission-based access control
- ✅ Scope-based data filtering
- ✅ Role assignment with expiration
- ✅ Full UI integration
- ✅ Zero-trust security principles

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review the API test results
3. Check browser console for errors
4. Verify backend logs
5. Ensure all migrations are run

## 📚 Additional Resources

- [Role-Based Access Control (RBAC) Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [Zero Trust Security Model](https://www.nist.gov/publications/zero-trust-architecture)
- [Principle of Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
