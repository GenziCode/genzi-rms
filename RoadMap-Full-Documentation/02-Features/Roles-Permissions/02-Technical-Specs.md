# ⚙️ Roles & Permissions - Technical Specifications
**Last Updated:** 2025-11-23 14:10

## 🏗️ Architecture

### Data Model

#### Role Schema
```typescript
interface Role {
  _id: ObjectId;
  tenantId: ObjectId;
  name: string;       // e.g., "Store Manager"
  code: string;       // e.g., "STORE_MANAGER" (Unique per tenant)
  description?: string;
  isSystemRole: boolean; // Protected from deletion
  permissions: string[]; // Array of permission codes (e.g., ["pos:sale", "inventory:*"])
  scope: {
    type: 'all' | 'store' | 'department';
    values?: string[]; // IDs of stores/departments
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Permission Schema
Permissions are static code definitions in `backend/src/config/permissions.config.ts` but are also synced to the database for reference.

```typescript
interface PermissionDefinition {
  code: string;     // e.g., "pos:void"
  module: string;   // e.g., "pos"
  action: string;   // e.g., "void"
  category: 'crud' | 'action' | 'report' | 'admin' | 'system';
}
```

### 🔒 Security Implementation

#### Middleware: `requirePermission`
Used to protect API routes.
```typescript
// Example Usage
router.post('/sales/void', requirePermission('pos:void'), salesController.voidSale);
```

#### Middleware: `resolveTenant`
Ensures roles are isolated per tenant.

### 🔄 Data Flow

1.  **Initialization**: On tenant creation (or manual trigger), `RoleService.initializeDefaultRoles()` creates the standard roles.
2.  **Authentication**: When a user logs in, their `role` code is embedded in the JWT (or looked up from DB).
3.  **Authorization**:
    *   Frontend: `useHasPermission('pos:void')` hook checks the user's loaded permissions.
    *   Backend: Middleware verifies the user has the required permission code (handling wildcards).

### 🧩 Key Components (Frontend)

*   `RolesPermissionsPage.tsx`: Main entry point.
*   `PermissionMatrix.tsx`: Complex grid for viewing/editing permissions.
*   `RoleFormModal.tsx`: Form for creating/editing roles.
*   `PermissionSelector.tsx`: Reusable component for selecting permissions.

### 📡 API Endpoints

*   `GET /api/roles`: List all roles.
*   `POST /api/roles`: Create a new role.
*   `PUT /api/roles/:id`: Update a role.
*   `DELETE /api/roles/:id`: Delete a role.
*   `GET /api/roles/analytics`: Get usage stats.
*   `GET /api/roles/built-in`: Get system role definitions.
*   `POST /api/roles/initialize`: Reset/Init default roles.

---
*Genzi RMS Documentation*
