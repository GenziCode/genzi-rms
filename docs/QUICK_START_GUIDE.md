# 🚀 Genzi RMS - Quick Start Guide

**Welcome to Genzi RMS!** Your backend is built and ready to run!

---

## ✅ What's Been Built

**Phase 0 & Phase 1 Complete!**

- ✅ **28 TypeScript files** created
- ✅ **Multi-tenant architecture** implemented
- ✅ **Authentication system** with JWT
- ✅ **MongoDB integration** with connection pooling
- ✅ **Redis integration** for caching
- ✅ **Docker environment** ready
- ✅ **Security middleware** configured
- ✅ **Testing framework** setup

---

## 🏃 Getting Started (3 Minutes)

### Option 1: Docker (Easiest - Recommended) 🐳

```bash
# 1. Navigate to project
cd genzi-rms

# 2. Start all services
docker-compose up

# That's it! The API is running!
# ✅ API: http://localhost:5000
# ✅ MongoDB Express GUI: http://localhost:8081 (admin/admin123)
```

**What Docker starts:**
- ✅ MongoDB 6.x
- ✅ Redis 7.x
- ✅ Backend API with hot reload
- ✅ MongoDB Express (database GUI)

---

### Option 2: Local Development 💻

**Prerequisites:**
- Node.js 18+
- MongoDB 6+ running locally
- Redis 7+ running locally

```bash
# 1. Install backend dependencies
cd genzi-rms/backend
npm install

# 2. Start the server
npm run dev

# ✅ API running on http://localhost:5000
```

---

## 🧪 Test the API

### 1. Health Check ✅
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-10T...",
    "uptime": 12.34
  }
}
```

---

### 2. Register First Tenant 🏢
```bash
curl -X POST http://localhost:5000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Restaurant",
    "subdomain": "demo",
    "email": "owner@demo.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "...",
      "name": "Demo Restaurant",
      "subdomain": "demo",
      "url": "https://demo.genzirms.com"
    },
    "user": {
      "id": "...",
      "email": "owner@demo.com",
      "role": "owner"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "..."
  },
  "message": "Tenant registered successfully..."
}
```

---

### 3. Login 🔐
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -d '{
    "email": "owner@demo.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "owner@demo.com",
      "fullName": "John Doe",
      "role": "owner"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "...",
    "expiresIn": "15m"
  }
}
```

---

### 4. Get User Profile 👤
```bash
# Replace {TOKEN} with accessToken from login response

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Tenant: demo"
```

---

## 📁 Project Files

```
genzi-rms/
├── backend/               ✅ Complete backend
│   ├── src/              ✅ 28 TypeScript files
│   ├── package.json      ✅ All dependencies
│   ├── tsconfig.json     ✅ TypeScript config
│   ├── .env              ✅ Environment variables
│   ├── Dockerfile        ✅ Production container
│   └── Dockerfile.dev    ✅ Development container
├── frontend/             📦 Coming in Phase 2
├── docker-compose.yml    ✅ Docker orchestration
└── README.md             ✅ Documentation
```

---

## 🎯 What's Working

| Feature | Status | Endpoint |
|---------|--------|----------|
| Tenant Registration | ✅ | POST /api/tenants/register |
| Subdomain Check | ✅ | GET /api/tenants/check-subdomain/:sub |
| User Login | ✅ | POST /api/auth/login |
| Token Refresh | ✅ | POST /api/auth/refresh |
| Get Profile | ✅ | GET /api/auth/me |
| User Logout | ✅ | POST /api/auth/logout |
| Health Check | ✅ | GET /api/health |

---

## 🔧 Development Commands

```bash
# In backend directory

npm run dev          # Start with hot reload
npm test             # Run tests
npm run lint         # Check code quality
npm run format       # Format code
npm run build        # Build for production
npm start            # Run production build
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB connection error
```bash
# Check if MongoDB is running
mongosh

# Or start via Docker
docker-compose up mongo
```

### Redis connection error
```bash
# Check if Redis is running
redis-cli ping

# Or start via Docker
docker-compose up redis
```

---

## 📊 Database Access

### MongoDB Express GUI
1. Start Docker: `docker-compose --profile tools up`
2. Open: http://localhost:8081
3. Login: admin / admin123
4. Browse databases and collections

### MongoDB CLI
```bash
# Connect to MongoDB
mongosh

# List databases
show dbs

# Use master database
use genzi_master

# List collections
show collections

# Query tenants
db.tenants.find()

# Query users
db.users.find()
```

---

## 🎯 Next Steps

### ✅ Phase 0 & 1 Complete!

**You can now:**
1. Register tenants
2. Authenticate users
3. Multi-tenant data isolation working
4. All security in place

### 🚀 Ready for Phase 2

**Coming Next:**
- Product Management API
- Point of Sale API
- Inventory Management API
- Customer Management API
- Reporting API

**Say:** "Continue with Phase 2" to build MVP features!

---

## 📚 Documentation

- `README.md` - Project overview
- `BACKEND_BUILD_SUMMARY.md` - What was built
- `TECHNICAL_ARCHITECTURE.md` - Architecture details
- `API_SPECIFICATION.md` - API documentation
- `MULTI_TENANT_STRATEGY.md` - Multi-tenancy guide

---

## ✨ Highlights

### Multi-Tenant Magic ✨
Each tenant gets:
- ✅ Own database (complete isolation)
- ✅ Own subdomain
- ✅ Own users
- ✅ Usage limits
- ✅ Feature flags
- ✅ 14-day free trial

### Security First 🔒
- ✅ JWT tokens (15min access, 7 day refresh)
- ✅ Bcrypt password hashing
- ✅ Role-based access control
- ✅ Rate limiting
- ✅ Input validation
- ✅ Security headers
- ✅ CORS protection

### Developer Experience 🎨
- ✅ TypeScript for type safety
- ✅ Hot reload in development
- ✅ Docker for easy setup
- ✅ Comprehensive logging
- ✅ Clean code structure
- ✅ Testing framework ready

---

## 🎉 Congratulations!

**Your backend is live and ready!**

Run `docker-compose up` and start testing! 🚀

---

**Built:** November 10, 2024  
**Status:** ✅ Phase 0 & Phase 1 Complete  
**Ready For:** Phase 2 Implementation

