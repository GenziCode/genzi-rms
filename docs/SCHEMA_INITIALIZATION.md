# ✅ Schema Initialization - Fixed!

**Issue:** MongoDB collections weren't being created because models weren't initialized  
**Solution:** Server now initializes models on startup  
**Status:** ✅ FIXED

---

## 🔧 What Was Changed

### Updated: `src/server.ts`

**Before:**
```typescript
await getMasterConnection();
// Collections not created!
```

**After:**
```typescript
const masterConn = await getMasterConnection();

// Initialize models (creates collections and indexes)
const Tenant = masterConn.model('Tenant', TenantSchema);
const User = masterConn.model('User', UserSchema);

// Ensure indexes are created
await Tenant.createIndexes();
await User.createIndexes();
```

---

## 📊 What Happens Now

### When Server Starts:

```
1. Connects to MongoDB
2. Creates 'tenants' collection with indexes
3. Creates 'users' collection with indexes
4. Server starts listening on port 5000
```

### Collections Created in Master Database:

**Database:** `genzi-rms` (or `genzi_master`)

**Collections:**
- ✅ `tenants` - Stores all tenant information
- ✅ `users` - Stores all user accounts

**Indexes Created:**

**tenants collection:**
- `subdomain` (unique)
- `customDomain` (unique, sparse)
- `status`
- `subscription.status`

**users collection:**
- `tenantId` + `email` (composite unique)
- `tenantId` + `role`
- `status`

---

## 🚀 Start the Server

```bash
cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms/backend

npm run dev
```

### Expected Output:

```
2025-11-10 16:50:00 [info]: Starting Genzi RMS API Server...
2025-11-10 16:50:00 [info]: Environment: development
2025-11-10 16:50:00 [info]: Initializing database connections...
2025-11-10 16:50:00 [info]: Connecting to Master database at: mongodb://localhost:27017/genzi-rms
2025-11-10 16:50:01 [info]: ✅ Master database connected successfully
2025-11-10 16:50:01 [info]: Creating master database collections...
2025-11-10 16:50:01 [info]: ✅ Master database connected and initialized
2025-11-10 16:50:01 [info]: Initializing Redis...
2025-11-10 16:50:01 [warn]: Redis not configured - skipping Redis connection
2025-11-10 16:50:01 [warn]: ⚠️  Redis not available - running without cache
2025-11-10 16:50:01 [info]: Express app configured successfully
2025-11-10 16:50:01 [info]: ============================================================
2025-11-10 16:50:01 [info]: 🚀 Genzi RMS API Server running!
2025-11-10 16:50:01 [info]: 📍 URL: http://localhost:5000
2025-11-10 16:50:01 [info]: 📊 Environment: development
2025-11-10 16:50:01 [info]: ⏰ Started: 11/10/2024, 4:50:01 PM
2025-11-10 16:50:01 [info]: ============================================================
```

---

## 🗄️ Verify in MongoDB

### Option 1: MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You should see database: `genzi-rms`
4. Inside you'll see collections:
   - `tenants`
   - `users`

### Option 2: MongoDB Shell

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017

# Or if you have mongosh
mongosh mongodb://localhost:27017

# Switch to database
use genzi-rms

# List collections
show collections

# Should show:
# tenants
# users

# Check indexes on tenants
db.tenants.getIndexes()

# Check indexes on users
db.users.getIndexes()
```

---

## 🧪 Test the API

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register First Tenant

**This will create:**
- Entry in `tenants` collection
- Entry in `users` collection
- New database `tenant_demo_xxxxx`
- Default categories and store in tenant database

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

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "673068a1b2c3d4e5f6789012",
      "name": "Demo Restaurant",
      "subdomain": "demo",
      "url": "https://demo.localhost"
    },
    "user": {
      "id": "673068a1b2c3d4e5f6789013",
      "email": "owner@demo.com",
      "role": "owner"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Tenant registered successfully. Welcome to Genzi RMS!"
}
```

### 3. Verify in Database

```bash
# In MongoDB shell
use genzi-rms

# Check tenants collection
db.tenants.find().pretty()

# Should show your registered tenant

# Check users collection
db.users.find().pretty()

# Should show the owner user

# List all databases (should include tenant database)
show dbs

# Should show:
# genzi-rms
# tenant_demo_1731247123456 (or similar)
```

### 4. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -d '{
    "email": "owner@demo.com",
    "password": "SecurePass123"
  }'
```

---

## 📋 What Collections Are Created

### Master Database (`genzi-rms` or `genzi_master`)

| Collection | Created When | Purpose |
|------------|--------------|---------|
| `tenants` | Server starts | Stores all tenants |
| `users` | Server starts | Stores all users |

### Tenant Database (`tenant_{subdomain}_{timestamp}`)

| Collection | Created When | Purpose |
|------------|--------------|---------|
| `categories` | Tenant registers | Product categories |
| `stores` | Tenant registers | Store locations |
| `products` | When first product is added | Product catalog |
| `sales` | When first sale is made | Sales transactions |
| `customers` | When first customer is added | Customer database |
| `inventory` | When inventory is tracked | Stock levels |

---

## ✅ Expected Behavior After Fix

### 1. Server Startup
```
✅ Connects to MongoDB
✅ Creates 'tenants' collection (if not exists)
✅ Creates 'users' collection (if not exists)
✅ Creates all indexes
✅ Skips Redis (configured as 'skip')
✅ Starts Express server
```

### 2. After Tenant Registration
```
✅ New document in 'tenants' collection
✅ New document in 'users' collection
✅ New database created: tenant_demo_xxxxx
✅ 'categories' collection with 4 default categories
✅ 'stores' collection with 1 default store
```

### 3. After Login
```
✅ Validates user exists
✅ Checks password
✅ Generates JWT tokens
✅ Returns user profile with tokens
```

---

## 🎯 Summary

**Issue:** Collections weren't created because models weren't initialized  
**Fix:** Server now initializes Tenant and User models on startup  
**Result:** Collections and indexes are created when server starts  

**Status:** ✅ READY TO TEST

---

## 🚀 Next Steps

```bash
# 1. Start the server
cd backend
npm run dev

# 2. Wait for this log message:
# "✅ Master database connected and initialized"

# 3. Test in another terminal:
curl http://localhost:5000/api/health

# 4. Register a tenant:
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "subdomain": "test",
    "email": "test@test.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# 5. Check MongoDB - you should see:
#    - tenants collection with 1 document
#    - users collection with 1 document
#    - New database: tenant_test_xxxxx
```

---

**Status:** ✅ Schema initialization fixed  
**Next:** Run `npm run dev` and test!

