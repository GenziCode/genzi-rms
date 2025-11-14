# Form Permissions Integration Guide

This guide shows how to integrate form-level permissions into existing routes.

## Quick Start

### Option 1: Specific Form Check

```typescript
import { requireFormAccess } from '../middleware/formPermission.middleware';

router.get('/products', 
  authenticate,
  requireFormAccess('frmProductFields'),
  productController.getProducts
);
```

### Option 2: Automatic Route Mapping

```typescript
import { requireRouteAccess } from '../middleware/formPermission.middleware';

// Apply to all routes in this file
router.use(requireRouteAccess);

// Or apply to specific routes
router.get('/products',
  authenticate,
  requireRouteAccess,
  productController.getProducts
);
```

## Route-to-Form Mapping

Forms are mapped in `backend/src/config/forms.config.ts`. To add a new mapping:

```typescript
export const ROUTE_TO_FORM_MAP: Record<string, string> = {
  'GET /api/products': 'frmProductFields',
  'POST /api/products': 'frmProductFields',
  // ... add more mappings
};
```

## Examples

### Product Routes

```typescript
import { requireFormAccess } from '../middleware/formPermission.middleware';

router.get('/products', 
  authenticate,
  requireFormAccess('frmProductFields'),
  productController.getProducts
);

router.post('/products',
  authenticate,
  requireFormAccess('frmProductFields'),
  productController.createProduct
);
```

### Customer Routes

```typescript
router.get('/customers',
  authenticate,
  requireFormAccess('frmMembershipInfo'),
  customerController.getCustomers
);
```

### Purchase Order Routes

```typescript
router.get('/purchase-orders',
  authenticate,
  requireFormAccess('frmPurchaseOrder'),
  purchaseOrderController.getPurchaseOrders
);
```

## Checking Access in Controllers

If you need to check access programmatically:

```typescript
import { formPermissionService } from '../services/formPermission.service';

async someMethod(req: TenantRequest) {
  const hasAccess = await formPermissionService.hasFormAccess(
    req.user.tenantId,
    req.user.id,
    'frmProductFields'
  );
  
  if (!hasAccess) {
    throw new ForbiddenError('Access denied');
  }
}
```

## Frontend Integration

Use the API endpoints to check access:

```typescript
// Check single form
const response = await fetch('/api/form-permissions/check/frmProductFields');
const { data } = await response.json();
if (data.hasAccess) {
  // Show UI element
}

// Bulk check
const formNames = ['frmProductFields', 'frmMembershipInfo'].join(',');
const response = await fetch(`/api/form-permissions/check-bulk?formNames=${formNames}`);
const { data } = await response.json();
// data.access = { 'frmProductFields': true, 'frmMembershipInfo': false }
```

## Notes

- Form permissions check module-level permissions first
- If a form has a module, it checks `module:read` permission
- Form-specific permissions use `form:formName` format
- Wildcard permissions (`*`) grant access to everything
- Route mapping is optional - routes without mappings are allowed (backward compatibility)

