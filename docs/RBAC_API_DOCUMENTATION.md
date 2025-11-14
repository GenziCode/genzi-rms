# RBAC API Documentation

**Created:** 2025-01-13 19:00:00 UTC  
**Last Updated:** 2025-01-13 19:00:00 UTC

## Overview

This document provides comprehensive API documentation for the Role-Based Access Control (RBAC) system.

---

## Authentication

All RBAC endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
X-Tenant: <subdomain>
```

---

## Roles API

### Get All Roles

**GET** `/api/roles`

Get all roles for the current tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "string",
        "name": "string",
        "code": "string",
        "description": "string",
        "category": "system" | "custom",
        "permissions": ["string"],
        "scope": {
          "type": "all" | "store" | "department" | "custom",
          "storeIds": ["string"],
          "departmentIds": ["string"]
        },
        "isSystemRole": boolean,
        "isActive": boolean,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
}
```

### Get Role by ID

**GET** `/api/roles/:id`

Get a specific role by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "role": { /* Role object */ }
  }
}
```

### Create Role

**POST** `/api/roles`

Create a new role. Requires `role:create` permission.

**Request Body:**
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "category": "custom",
  "permissionCodes": ["string"],
  "scope": {
    "type": "all",
    "storeIds": ["string"],
    "departmentIds": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": { /* Role object */ }
  },
  "message": "Role created successfully"
}
```

### Update Role

**PUT** `/api/roles/:id`

Update an existing role. Requires `role:update` permission.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "permissionCodes": ["string"],
  "isActive": boolean
}
```

### Delete Role

**DELETE** `/api/roles/:id`

Delete a role. Requires `role:delete` permission. System roles cannot be deleted.

---

## Permissions API

### Get All Permissions

**GET** `/api/permissions`

Get all available permissions.

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "code": "string",
        "name": "string",
        "module": "string",
        "action": "string",
        "description": "string",
        "category": "crud" | "action" | "report" | "admin"
      }
    ]
  }
}
```

### Get Permissions by Module

**GET** `/api/permissions/module/:module`

Get permissions for a specific module.

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [ /* Permission objects */ ]
  }
}
```

### Get Permissions Grouped by Module

**GET** `/api/permissions/grouped`

Get permissions grouped by module.

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": {
      "product": [ /* Permission objects */ ],
      "customer": [ /* Permission objects */ ]
    }
  }
}
```

---

## Form Permissions API

### Get All Forms

**GET** `/api/form-permissions`

Get all form permissions for the tenant.

**Query Parameters:**
- `category` (optional): Filter by category
- `module` (optional): Filter by module
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "formName": "string",
      "formCaption": "string",
      "formCategory": "string",
      "module": "string",
      "route": "string",
      "method": "string",
      "requiredPermission": "string",
      "isActive": boolean
    }
  ]
}
```

### Check Form Access

**GET** `/api/form-permissions/check/:formName`

Check if the current user has access to a form.

**Response:**
```json
{
  "success": true,
  "data": {
    "formName": "string",
    "hasAccess": boolean
  }
}
```

### Bulk Check Form Access

**POST** `/api/form-permissions/check-bulk`

Check access for multiple forms.

**Request Body:**
```json
{
  "formNames": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access": {
      "frmProductFields": true,
      "frmMembershipInfo": false
    }
  }
}
```

---

## Field Permissions API

### Get Fields for Form

**GET** `/api/field-permissions/forms/:formName`

Get all field permissions for a form.

**Response:**
```json
{
  "success": true,
  "data": {
    "formName": "string",
    "fields": [
      {
        "controlName": "string",
        "controlType": "string",
        "label": "string",
        "isVisible": boolean,
        "isEditable": boolean,
        "isRequired": boolean
      }
    ],
    "total": number
  }
}
```

### Get User Fields for Form

**GET** `/api/field-permissions/forms/:formName/user`

Get field permissions filtered for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "formName": "string",
    "fields": [ /* Field objects */ ],
    "total": number
  }
}
```

### Check Field Access

**GET** `/api/field-permissions/check/:formName/:controlName`

Check if user can edit a specific field.

**Response:**
```json
{
  "success": true,
  "data": {
    "formName": "string",
    "controlName": "string",
    "canEdit": boolean
  }
}
```

---

## User Role Assignment API

### Get User Roles

**GET** `/api/users/:id/roles`

Get all roles assigned to a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [ /* Role objects */ ]
  }
}
```

### Assign Role to User

**POST** `/api/users/:id/roles`

Assign a role to a user. Requires admin permissions.

**Request Body:**
```json
{
  "roleId": "string",
  "expiresAt": "string (ISO date)",
  "scopeOverride": {
    "type": "all" | "store" | "department",
    "storeIds": ["string"],
    "departmentIds": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "userId": "string",
      "roleId": "string",
      "assignedAt": "string",
      "expiresAt": "string"
    }
  },
  "message": "Role assigned successfully"
}
```

### Remove Role from User

**DELETE** `/api/users/:id/roles/:roleId`

Remove a role from a user. Requires admin permissions.

**Response:**
```json
{
  "success": true,
  "message": "Role removed successfully"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": []
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `CONFLICT` (409): Resource conflict (e.g., duplicate code)

---

## Permission Codes Reference

### Product Permissions
- `product:create` - Create products
- `product:read` - Read products
- `product:update` - Update products
- `product:delete` - Delete products

### Customer Permissions
- `customer:create` - Create customers
- `customer:read` - Read customers
- `customer:update` - Update customers
- `customer:delete` - Delete customers

### Role Permissions
- `role:create` - Create roles
- `role:read` - Read roles
- `role:update` - Update roles
- `role:delete` - Delete roles

### Wildcard Permissions
- `*` - All permissions
- `module:*` - All permissions for a module (e.g., `product:*`)

---

## Rate Limiting

RBAC endpoints are subject to rate limiting:
- **Standard endpoints:** 100 requests per minute
- **Write operations:** 20 requests per minute

---

## Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/`

---

## Support

For questions or issues, please contact the development team or refer to the main documentation.

