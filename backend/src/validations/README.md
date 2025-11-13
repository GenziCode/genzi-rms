# Validation Rules Organization

**Created:** 2025-11-13 20:30 UTC  
**Last Updated:** 2025-11-13 20:30 UTC

## Overview

All route validation rules have been moved from route files to dedicated validation files in `/validations` folder. This keeps route files clean and focused on routing logic.

## Structure

Each validation file follows the naming pattern: `{module}.validations.ts`

Example: `product.validations.ts`, `user.validations.ts`, `tenant.validations.ts`

## Usage Pattern

### In Route Files

```typescript
import { createProductValidation, productIdParamValidation } from '../validations/product.validations';

router.post('/', [...createProductValidation, validate], controller.create);
router.get('/:id', [...productIdParamValidation, validate], controller.getById);
```

### Validation File Structure

```typescript
import { body, param, query } from 'express-validator';

export const createValidation = [
  body('field').trim().notEmpty().withMessage('Field is required'),
  // ... more validations
];

export const updateValidation = [
  param('id').isMongoId().withMessage('Invalid ID'),
  body('field').optional().trim(),
  // ... more validations
];
```

## Completed Validations

- ✅ `auth.validations.ts` - Authentication routes
- ✅ `tenant.validations.ts` - Tenant management routes
- ✅ `product.validations.ts` - Product routes
- ✅ `user.validations.ts` - User management routes

## Remaining Routes to Extract

- ⏳ `customer.routes.ts`
- ⏳ `invoice.routes.ts`
- ⏳ `payment.routes.ts`
- ⏳ `inventory.routes.ts`
- ⏳ `pos.routes.ts`
- ⏳ `category.routes.ts`
- ⏳ `vendor.routes.ts`
- ⏳ `purchaseOrder.routes.ts`
- ⏳ `store.routes.ts`
- ⏳ `settings.routes.ts`
- ⏳ `notification.routes.ts`
- ⏳ `reports.routes.ts`
- ⏳ `audit.routes.ts`
- ⏳ `webhook.routes.ts`
- ⏳ `sync.routes.ts`
- ⏳ `export.routes.ts`
- ⏳ `file.routes.ts`

## Naming Conventions

- `{action}{Resource}Validation` - e.g., `createProductValidation`, `updateUserValidation`
- `{resource}IdParamValidation` - e.g., `productIdParamValidation`, `userIdParamValidation`
- `get{Resource}sValidation` - Query validations for list endpoints
- `{action}Validation` - Specific action validations, e.g., `adjustStockValidation`

## Best Practices

1. **Export each validation array separately** - Makes them reusable
2. **Use descriptive names** - Clear what endpoint they validate
3. **Group related validations** - Keep them in the same file
4. **Include JSDoc comments** - Document what each validation is for
5. **Always include `validate` middleware** - After validation arrays in routes

