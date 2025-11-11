# Genzi RMS - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000`  
**Status:** ✅ Phase 0 & 1 Complete  
**Last Updated:** November 10, 2024

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [System Endpoints](#system-endpoints)
4. [Tenant Management](#tenant-management)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Error Responses](#error-responses)
7. [Response Format](#response-format)

---

## 🚀 Getting Started

### Base URL
```
http://localhost:5000
```

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer {your_access_token}
```

### Tenant Context
In development, include tenant subdomain in header:
```
X-Tenant: {tenant_subdomain}
```

---

## 🔐 Authentication

### How It Works

1. **Register Tenant** → Get access + refresh tokens
2. **OR Login** → Get access + refresh tokens  
3. **Use Access Token** → Make authenticated requests
4. **When Expired** → Use refresh token to get new access token

### Token Expiration
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

---

## 📡 System Endpoints

### 1. Get API Information

Get basic API information and available endpoints.

**Endpoint:** `GET /`

**Authentication:** Not required

**Request:**
```bash
curl http://localhost:5000/
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Genzi RMS API",
    "version": "1.0.0",
    "docs": "/api/docs",
    "health": "/api/health"
  }
}
```

---

### 2. Health Check

Check if the API server is healthy and running.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Request:**
```bash
curl http://localhost:5000/api/health
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-10T12:00:20.192Z",
    "uptime": 18.3349127,
    "environment": "development"
  }
}
```

**Response Fields:**
- `status` (string): "healthy" or "unhealthy"
- `timestamp` (string): Current server time (ISO 8601)
- `uptime` (number): Server uptime in seconds
- `environment` (string): Current environment (development/production)

---

## 🏢 Tenant Management

### 3. Register Tenant

Create a new tenant with owner account. Automatically provisions a new database and initializes with default data.

**Endpoint:** `POST /api/tenants/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "Demo Restaurant",
  "subdomain": "demo",
  "email": "owner@demo.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Field Validation:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2-100 characters |
| `subdomain` | string | Yes | 3-30 chars, alphanumeric + hyphens, lowercase |
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| `firstName` | string | Yes | 1-50 characters |
| `lastName` | string | Yes | 1-50 characters |
| `phone` | string | No | Valid phone number (any format) |

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Restaurant",
    "subdomain": "demo",
    "email": "owner@demo.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "6911d3f171a511b00751b92d",
      "name": "Demo Restaurant",
      "subdomain": "demo",
      "url": "https://demo.localhost"
    },
    "user": {
      "id": "6911d3f171a511b00751b93c",
      "email": "owner@demo.com",
      "role": "owner"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Tenant registered successfully. Welcome to Genzi RMS!"
}
```

**What Gets Created:**
1. Tenant record in master database
2. Owner user account
3. New isolated database for tenant
4. Default categories (Beverages, Food, Others)
5. Default store (Main Store)
6. JWT access and refresh tokens

**Error Responses:**

`400 Bad Request` - Validation failed
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

`409 Conflict` - Subdomain or email already exists
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Subdomain already taken"
  }
}
```

---

### 4. Check Subdomain Availability

Check if a subdomain is available before registration.

**Endpoint:** `GET /api/tenants/check-subdomain/:subdomain`

**Authentication:** Not required

**Path Parameters:**
- `subdomain` (string): Subdomain to check

**Example Request:**
```bash
curl http://localhost:5000/api/tenants/check-subdomain/demo
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "available": false,
    "subdomain": "demo"
  }
}
```

**Available Subdomain:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "subdomain": "myrestaurant"
  }
}
```

---

## 🔐 Authentication Endpoints

### 5. User Login

Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Headers:**
```
Content-Type: application/json
X-Tenant: {tenant_subdomain}  (required in development)
```

**Request Body:**
```json
{
  "email": "owner@demo.com",
  "password": "SecurePass123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -d '{
    "email": "owner@demo.com",
    "password": "SecurePass123"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6911d3f171a511b00751b93c",
      "tenantId": "6911d3f171a511b00751b92d",
      "email": "owner@demo.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "owner",
      "permissions": ["*"],
      "avatar": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "message": "Login successful"
}
```

**Error Responses:**

`401 Unauthorized` - Invalid credentials
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

`401 Unauthorized` - Account not active
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User account is not active"
  }
}
```

`429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 min)
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many authentication attempts, please try again later"
  }
}
```

---

### 6. Refresh Access Token

Get a new access token using a valid refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** Not required (uses refresh token)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "message": "Token refreshed successfully"
}
```

**Error Responses:**

`401 Unauthorized` - Invalid or expired refresh token
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Invalid refresh token"
  }
}
```

---

### 7. Get Current User Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer {access_token}
X-Tenant: {tenant_subdomain}
```

**Example Request:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Tenant: demo"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6911d3f171a511b00751b93c",
      "email": "owner@demo.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "owner",
      "permissions": ["*"],
      "avatar": null,
      "phone": null,
      "emailVerified": false,
      "tenant": {
        "id": "6911d3f171a511b00751b92d",
        "name": "Demo Restaurant",
        "subdomain": "demo",
        "plan": "free"
      }
    }
  }
}
```

**Error Responses:**

`401 Unauthorized` - No token provided
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

`401 Unauthorized` - Token expired
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Token expired"
  }
}
```

---

### 8. Logout

Logout the current user (client should discard tokens).

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer {access_token}
X-Tenant: {tenant_subdomain}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Tenant: demo"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

**Note:** Client should remove tokens from storage after logout.

---

## 📊 Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message",
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      // Optional array of detailed errors (validation, etc.)
    ]
  }
}
```

---

## ❌ Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 400 | `INVALID_HOST` | Invalid host format |
| 400 | `TENANT_NOT_SPECIFIED` | Tenant not specified |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 401 | `TOKEN_EXPIRED` | Access token expired |
| 401 | `INVALID_TOKEN` | Invalid or malformed token |
| 401 | `REFRESH_TOKEN_EXPIRED` | Refresh token expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 403 | `TENANT_SUSPENDED` | Tenant account suspended |
| 404 | `NOT_FOUND` | Resource not found |
| 404 | `TENANT_NOT_FOUND` | Tenant does not exist |
| 404 | `ROUTE_NOT_FOUND` | API endpoint does not exist |
| 409 | `CONFLICT` | Duplicate entry (email, subdomain, etc.) |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 429 | `LIMIT_EXCEEDED` | Usage limit exceeded |
| 500 | `SERVER_ERROR` | Internal server error |

---

## 🔑 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | Tenant owner | All permissions (*) |
| `admin` | Administrator | Most permissions |
| `manager` | Store manager | Store operations, reports |
| `cashier` | POS operator | Sales, customers |
| `kitchen_staff` | Kitchen staff | Kitchen orders only |
| `waiter` | Wait staff | Orders, tables |

---

## 📝 API Usage Examples

### Complete Flow Example

#### 1. Register a New Tenant

```bash
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Awesome Cafe",
    "subdomain": "awesome",
    "email": "owner@awesome.com",
    "password": "MySecure123",
    "firstName": "Alice",
    "lastName": "Smith"
  }'
```

**Save the `accessToken` and `refreshToken` from response.**

---

#### 2. Login (Alternative to Registration)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: awesome" \
  -d '{
    "email": "owner@awesome.com",
    "password": "MySecure123"
  }'
```

**Save the tokens.**

---

#### 3. Get User Profile

```bash
# Replace {TOKEN} with your accessToken
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Tenant: awesome"
```

---

#### 4. When Token Expires (after 15 min)

```bash
# Use refresh token to get new access token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{YOUR_REFRESH_TOKEN}"
  }'
```

---

## 🧪 Testing with Postman

### Setup Postman Collection

1. **Create Environment:**
   - `base_url`: http://localhost:5000
   - `tenant`: demo
   - `access_token`: (will be set automatically)
   - `refresh_token`: (will be set automatically)

2. **Create Requests:**

**Register Tenant:**
- Method: POST
- URL: `{{base_url}}/api/tenants/register`
- Body: JSON (see example above)
- Tests (save tokens):
```javascript
pm.environment.set("access_token", pm.response.json().data.accessToken);
pm.environment.set("refresh_token", pm.response.json().data.refreshToken);
```

**Login:**
- Method: POST
- URL: `{{base_url}}/api/auth/login`
- Headers: `X-Tenant: {{tenant}}`
- Body: JSON (email, password)
- Tests: Same as above

**Get Profile:**
- Method: GET
- URL: `{{base_url}}/api/auth/me`
- Headers:
  - `Authorization: Bearer {{access_token}}`
  - `X-Tenant: {{tenant}}`

---

## 🗄️ Database Schema

### Master Database Collections

**Database:** `genzi-rms` (or `genzi_master`)

#### Tenants Collection

```javascript
{
  _id: ObjectId,
  name: "Demo Restaurant",
  slug: "demo-restaurant",
  subdomain: "demo",
  customDomain: null,
  dbName: "tenant_demo_1731247123456",
  owner: {
    name: "John Doe",
    email: "owner@demo.com",
    phone: null
  },
  subscription: {
    plan: "free",
    status: "trial",
    trialStartDate: Date,
    trialEndDate: Date,
    billingCycle: "monthly"
  },
  limits: {
    users: 5,
    stores: 1,
    products: 1000,
    monthlyTransactions: 5000,
    storageBytes: 1073741824
  },
  usage: {
    users: 1,
    stores: 1,
    products: 0,
    monthlyTransactions: 0,
    storageBytes: 0
  },
  features: {
    multiStore: false,
    restaurant: false,
    inventory: true,
    loyalty: false,
    reporting: true,
    api: false,
    webhooks: false
  },
  settings: {
    timezone: "America/New_York",
    currency: "USD",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h"
  },
  status: "active",
  createdAt: Date,
  updatedAt: Date
}
```

#### Users Collection

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  email: "owner@demo.com",
  password: "$2a$12$...", // bcrypt hashed
  firstName: "John",
  lastName: "Doe",
  role: "owner",
  permissions: ["*"],
  avatar: null,
  phone: null,
  emailVerified: false,
  mfaEnabled: false,
  lastLogin: Date,
  lastLoginIp: null,
  loginCount: 1,
  status: "active",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔒 Security Features

### Implemented

- ✅ **JWT Authentication:** Secure token-based auth
- ✅ **Password Hashing:** bcryptjs with cost 12
- ✅ **Rate Limiting:**
  - Global: 100 requests per 15 minutes
  - Auth endpoints: 5 attempts per 15 minutes
  - Per-tenant: Based on subscription plan
- ✅ **Input Validation:** express-validator on all inputs
- ✅ **CORS:** Configured with whitelist
- ✅ **Security Headers:** Helmet.js
- ✅ **Tenant Isolation:** Separate databases
- ✅ **Error Handling:** No sensitive data in errors

### Best Practices

1. **Store tokens securely** (httpOnly cookies or secure storage)
2. **Refresh tokens before expiry** (use refresh endpoint)
3. **Remove tokens on logout**
4. **Use HTTPS in production**
5. **Validate all user input**

---

## 📈 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **Global** | 100 requests | 15 minutes |
| **Auth Endpoints** | 5 attempts | 15 minutes |
| **Per-Tenant (Free)** | 100 requests | 15 minutes |
| **Per-Tenant (Basic)** | 500 requests | 15 minutes |
| **Per-Tenant (Pro)** | 2000 requests | 15 minutes |

---

## 🎯 Next API Endpoints (Phase 2)

**Coming Soon:**

### Product Management
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### POS System
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales
- `POST /api/sales/hold` - Hold transaction
- `GET /api/sales/hold/:id` - Resume held transaction

### Inventory
- `GET /api/inventory` - Get inventory status
- `POST /api/inventory/adjust` - Adjust stock

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer

---

## 📞 Support

**Documentation:** See `README.md` files  
**Issues:** Check `TROUBLESHOOTING.md`  
**Status:** All endpoints tested and working ✅

---

**API Version:** 1.0.0  
**Status:** Phase 0 & 1 Complete  
**Endpoints:** 8 working endpoints  
**Authentication:** JWT with refresh tokens  
**Multi-Tenancy:** Database-per-tenant  
**Security:** 0 vulnerabilities ✅

