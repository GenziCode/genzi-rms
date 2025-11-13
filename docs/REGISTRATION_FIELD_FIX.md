# Registration Field Name Fix

## Issue

Frontend registration was sending incorrect field names to the backend, causing validation errors for all fields.

## Root Cause

**Field name mismatch** - Frontend was using prefixed field names (`ownerEmail`, `ownerPassword`, etc.) but backend expected simple names (`email`, `password`, etc.).

### Frontend was sending:

```json
{
  "name": "Hasseb Autos",
  "subdomain": "hbc",
  "ownerFirstName": "Hasseb",      ❌
  "ownerLastName": "Ikram",        ❌
  "ownerEmail": "hasseb@genzi.com", ❌
  "ownerPassword": "hello1234"     ❌
}
```

### Backend expects:

```json
{
  "name": "Hasseb Autos",
  "subdomain": "hbc",
  "firstName": "Hasseb",           ✅
  "lastName": "Ikram",             ✅
  "email": "hasseb@genzi.com",     ✅
  "password": "Hello1234"          ✅
}
```

## Solution

Fixed frontend to match backend's field naming conventions (kept backend as-is).

## Files Changed

### 1. `frontend/src/types/index.ts`

Updated `RegisterTenantRequest` interface:

```typescript
export interface RegisterTenantRequest {
  name: string;
  subdomain: string;
  email: string;        // was: ownerEmail
  password: string;     // was: ownerPassword
  firstName: string;    // was: ownerFirstName
  lastName: string;     // was: ownerLastName
}
```

### 2. `frontend/src/pages/auth/RegisterPage.tsx`

**Updated validation schema:**

- Changed all field names to match backend expectations
- Enhanced password validation to match backend requirements (min 8 chars, uppercase, lowercase, number)
- Added validation for name length (2-100 chars)
- Added validation for subdomain length (3-30 chars)
- Added password helper text

**Updated form fields:**

- Changed all `register('ownerEmail')` → `register('email')`
- Changed all `register('ownerPassword')` → `register('password')`
- Changed all `register('ownerFirstName')` → `register('firstName')`
- Changed all `register('ownerLastName')` → `register('lastName')`

## Validation Rules (Now Matching Backend)

| Field        | Required | Validation                                          |
| ------------ | -------- | --------------------------------------------------- |
| `name`       | ✅ Yes   | 2-100 characters                                    |
| `subdomain`  | ✅ Yes   | 3-30 chars, lowercase, alphanumeric + hyphens       |
| `email`      | ✅ Yes   | Valid email format                                  |
| `password`   | ✅ Yes   | **Min 8 chars, 1 uppercase, 1 lowercase, 1 number** |
| `firstName`  | ✅ Yes   | 1-50 characters                                     |
| `lastName`   | ✅ Yes   | 1-50 characters                                     |
| `phone`      | ❌ No    | Valid phone number format                           |

## Password Requirements

⚠️ **Important:** Password must contain:

1. At least **8 characters** (not 6)
2. At least **1 uppercase** letter (A-Z)
3. At least **1 lowercase** letter (a-z)
4. At least **1 number** (0-9)

**Valid examples:**

- ✅ `"Hello1234"`
- ✅ `"Hasseb123"`
- ✅ `"GenziRMS2024"`

**Invalid examples:**

- ❌ `"hello1234"` (missing uppercase)
- ❌ `"HELLO1234"` (missing lowercase)
- ❌ `"HelloWorld"` (missing number)
- ❌ `"Hello12"` (less than 8 characters)

## Testing

### Valid Request (Frontend now sends):

```json
{
  "name": "Hasseb Autos",
  "subdomain": "hbc",
  "email": "hasseeb.ikram@genzi-rms.com",
  "password": "Hello1234",
  "firstName": "Hasseb",
  "lastName": "Ikram"
}
```

### Expected Success Response (201 Created):

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "...",
      "name": "Hasseb Autos",
      "subdomain": "hbc",
      "url": "https://hbc.genzirms.com"
    },
    "user": {
      "id": "...",
      "email": "hasseeb.ikram@genzi-rms.com",
      "role": "owner"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Tenant registered successfully. Welcome to Genzi RMS!"
}
```

## Status

✅ **Fixed** - Frontend now uses backend's field naming conventions
✅ **Enhanced** - Frontend validation now matches backend requirements exactly
✅ **Improved UX** - Added password requirements helper text

---

**Date Fixed:** Current session  
**Files Modified:** 2 frontend files  
**Breaking Change:** No (only fixing frontend to match existing backend API)  
**Convention:** Backend conventions maintained, frontend adapted




