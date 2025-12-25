# Backend-Frontend Integration Issues Analysis

## Overview
This document identifies broken endpoints and missing integrations between the backend and frontend of the Genzi RMS application.

## Critical Issues Found

### 1. **Products Service - Missing Endpoints**

#### Issue 1.1: Search Endpoint Mismatch
- **Frontend Call**: `GET /api/products/search?q={query}`
- **Backend Reality**: No dedicated `/search` endpoint exists
- **Backend Alternative**: `GET /api/products?search={query}` (search is a query parameter)
- **Impact**: Product search functionality is broken
- **Fix Required**: Update frontend to use the correct endpoint

#### Issue 1.2: Barcode Endpoint Missing
- **Frontend Call**: `GET /api/products/barcode/:code`
- **Backend Reality**: No `/barcode/:code` endpoint exists
- **Backend Alternative**: None - needs to be implemented
- **Impact**: Barcode scanning feature is non-functional
- **Fix Required**: Add barcode endpoint to backend OR update frontend to use SKU endpoint

#### Issue 1.3: QR Code GET Endpoint Missing
- **Frontend Call**: `GET /api/products/qr/:data`
- **Backend Reality**: Only `POST /api/products/scan-qr` exists (expects `{qrData}` in body)
- **Impact**: QR code scanning via GET request is broken
- **Fix Required**: Either add GET endpoint or update frontend to use POST

#### Issue 1.4: Product Stats Endpoint Missing
- **Frontend Call**: `GET /api/products/stats`
- **Backend Reality**: No stats endpoint exists
- **Impact**: Product statistics dashboard is broken
- **Fix Required**: Implement stats endpoint in backend

### 2. **Stores Service - Completely Missing**

#### Issue 2.1: No Frontend Service
- **Backend Routes**: `/api/stores` with full CRUD operations
- **Frontend Service**: Missing entirely
- **Impact**: Store management features cannot be accessed from frontend
- **Fix Required**: Create `stores.service.ts` in frontend

### 3. **Image Upload Endpoints - Disabled**

#### Issue 3.1: Product Image Upload
- **Frontend Call**: `POST /api/products/:id/image`
- **Backend Reality**: Endpoint is commented out/disabled
- **Impact**: Product image uploads don't work
- **Fix Required**: Either enable backend endpoint or remove frontend functionality

### 4. **Potential Response Structure Mismatches**

#### Issue 4.1: POS Service Normalization
- The POS service has extensive normalization logic suggesting backend responses may not match expected structure
- **Risk**: Runtime errors when backend response structure changes
- **Recommendation**: Standardize backend response format

## Missing Frontend Services

Based on backend routes that exist but have no frontend service:

1. **stores.service.ts** - Store management (CRITICAL)
2. **categoryImportExport.service.ts** - Category import/export
3. **formPermissions.service.ts** - Form-level permissions
4. **fieldPermissions.service.ts** - Field-level permissions

## Backend Endpoints Not Used by Frontend

These endpoints exist in backend but are not called by any frontend service:

1. `/api/categories/bulk/*` - Bulk operations (partially integrated)
2. `/api/category-tags/*` - Category tagging system
3. `/api/category-workflows/*` - Category workflows
4. `/api/category-automation-rules/*` - Automation rules
5. `/api/category-permissions/*` - Category permissions
6. `/api/category-validation-rules/*` - Validation rules
7. `/api/category-collaborations/*` - Collaboration features
8. `/api/category-security/*` - Security features
9. `/api/category-approvals/*` - Approval workflows
10. `/api/form-permissions/*` - Form permissions
11. `/api/field-permissions/*` - Field permissions

## Recommendations

### Priority 1 (Critical - Breaks Core Functionality)
1. Fix product search endpoint mismatch
2. Create stores.service.ts
3. Fix or remove barcode/QR scanning endpoints
4. Add product stats endpoint

### Priority 2 (Important - Affects Features)
1. Standardize API response structures
2. Add missing category-related services
3. Implement or remove image upload functionality

### Priority 3 (Enhancement - Advanced Features)
1. Add services for category workflows, tags, automation
2. Implement permission management services
3. Add bulk operation services

## Next Steps

1. **Immediate**: Fix critical product service endpoints
2. **Short-term**: Create missing stores service
3. **Medium-term**: Implement remaining category features
4. **Long-term**: Add advanced workflow and permission features
