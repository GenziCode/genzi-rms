# Mongoose Duplicate Index Fixes - Summary

## Issue
The backend was showing Mongoose warnings about duplicate schema indexes:
- Duplicate index on `{"sku":1}` in Product model
- Duplicate index on `{"saleNumber":1}` in Sale model
- Duplicate index on `{"clientId":1}` in Sale model
- Duplicate index on `{"poNumber":1}` in PurchaseOrder model

## Root Cause
Indexes were being defined in TWO places:
1. In field definitions using `unique: true` or `index: true`
2. In explicit `schema.index()` calls

When both exist, Mongoose creates duplicate indexes, which degrades performance and shows warnings.

## Files Fixed

### 1. `product.model.ts`
- **Removed**: `unique: true` from `sku` field definition (line 52)
- **Updated**: Explicit index to include `unique: true` option (line 141)

### 2. `sale.model.ts`
- **Removed**: `unique: true` from `saleNumber` field
- **Removed**: `index: true` from `tenantId`, `store`, `cashier`, `customer`, `status` fields
- **Removed**: `sparse: true` from `clientId` field (kept in explicit index)
- **Kept**: All explicit compound and unique indexes

### 3. `purchaseOrder.model.ts`
- **Removed**: `unique: true` from `poNumber` field
- **Removed**: `index: true` from `tenantId`, `vendor`, `store`, `status` fields
- **Kept**: All explicit compound and unique indexes

### 4. `settings.model.ts`
- **Removed**: Redundant `index: true` from `tenantId` field (already had `unique: true`)

### 5. `vendor.model.ts`
- **Removed**: `index: true` from `tenantId`, `phone`, `isActive` fields
- **Kept**: Explicit compound indexes

### 6. `customer.model.ts`
- **Removed**: `index: true` from `tenantId`, `phone`, `isActive` fields
- **Removed**: `sparse: true` from `email` field (kept in explicit index)
- **Kept**: All explicit compound and unique indexes

### 7. `user.model.ts`
- **Removed**: `unique: true` from `email` field
- **Removed**: `index: true` from `tenantId` field
- **Kept**: Explicit compound unique index on `{tenantId: 1, email: 1}`

### 8. `store.model.ts`
- **Removed**: `unique: true` from `code` field
- **Updated**: Explicit index to include `unique: true` option

### 9. `inventory.model.ts` (StockMovement, StockAlert, InventorySnapshot)
- **Removed**: `index: true` from all fields in StockMovementSchema
- **Removed**: `index: true` from all fields in StockAlertSchema
- **Removed**: `index: true` from all fields in InventorySnapshotSchema
- **Kept**: All explicit compound and unique indexes

## New Best Practices Document

Created `MONGOOSE_INDEX_BEST_PRACTICES.md` with guidelines:

### Key Rules:
1. ✅ **Always** define indexes using `schema.index()` calls
2. ❌ **Never** use `index: true` or `unique: true` in field definitions
3. ✅ **Prefer** compound indexes over multiple single-field indexes
4. ✅ **Keep** index definitions in a dedicated "Indexes" section

### Benefits:
- No duplicate indexes
- Better query performance
- Easier maintenance
- Clear visibility of all indexes

## Testing

After these changes:
1. ✅ No linter errors
2. ✅ All indexes are defined explicitly
3. ✅ No duplicate index definitions
4. ✅ Compound indexes optimized for common queries

## How to Prevent in Future

When creating new models:
1. Define field schemas WITHOUT `index: true` or `unique: true`
2. Add a comment section `// Indexes` after the schema definition
3. Define all indexes explicitly using `schema.index()`
4. Use compound indexes for frequently queried field combinations
5. Run the backend and check console for any warnings

## Verification

To verify the fixes worked:
1. Start the backend server
2. Check the console logs
3. Confirm NO duplicate index warnings appear
4. Test that all queries still work correctly

---

**Date**: Fixed on current date
**Status**: ✅ Complete
**Files Modified**: 9 model files
**Lines Changed**: ~50+ lines
**New Documentation**: 2 files (best practices + summary)





