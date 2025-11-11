# 🚀 Start Genzi RMS Server - Quick Guide

**All setup is complete! Ready to run!**

---

## ✅ What You Have

- ✅ **28 TypeScript files** - Complete backend code
- ✅ **589 npm packages** - All dependencies installed (0 vulnerabilities)
- ✅ **.env file** - Environment configured
- ✅ **Docker setup** - Ready to start
- ✅ **Phase 0 & 1** - 100% Complete

---

## 🎬 START THE SERVER (Choose One Method)

### Method 1: Docker Compose ⭐ **RECOMMENDED**

**Single command starts everything!**

```bash
# Navigate to project root
cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms

# Start all services
docker-compose up

# Or run in background
docker-compose up -d
```

**What starts:**
- ✅ MongoDB 6.x (port 27017)
- ✅ Redis 7.x (port 6379)  
- ✅ Backend API (port 5000)
- ✅ MongoDB Express GUI (port 8081)

**Services will be available at:**
- Backend API: http://localhost:5000
- MongoDB Express: http://localhost:8081 (username: admin, password: admin123)

---

### Method 2: Local Development

**Requirements:**
- MongoDB installed and running
- Redis installed and running

```bash
cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms/backend

npm run dev
```

---

## 🧪 TESTING (Once Server is Running)

### Open a new terminal and run:

```bash
# 1. Health Check
curl http://localhost:5000/api/health

# 2. API Info
curl http://localhost:5000/

# 3. Register a Tenant
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

# 4. Login (use X-Tenant header for development)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: demo" \
  -d '{
    "email": "owner@demo.com",
    "password": "SecurePass123"
  }'
```

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart backend only
docker-compose restart backend

# Rebuild and start
docker-compose up --build
```

---

## 📊 Monitoring

### View Logs

```bash
# Backend logs
docker-compose logs -f backend

# MongoDB logs
docker-compose logs -f mongo

# Redis logs
docker-compose logs -f redis

# All logs
docker-compose logs -f
```

### Check Running Containers

```bash
docker-compose ps
```

---

## 🔍 Database Access

### MongoDB Express (GUI)

1. Open browser: http://localhost:8081
2. Login: `admin` / `admin123`
3. Browse databases:
   - `genzi_master` - Master database (tenants, users)
   - `tenant_demo_123456` - Tenant databases (products, sales, etc.)

### MongoDB CLI

```bash
# Connect to MongoDB
docker-compose exec mongo mongosh

# List databases
show dbs

# Use master database
use genzi_master

# List collections
show collections

# Query tenants
db.tenants.find().pretty()

# Query users
db.users.find().pretty()
```

### Redis CLI

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check keys
KEYS *

# Get value
GET key_name
```

---

## 🛑 Stop the Server

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears all data)
docker-compose down -v
```

---

## ⚠️ Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID {PID} /F
```

### Docker Issues

```bash
# Rebuild containers
docker-compose down
docker-compose up --build

# Clear everything and start fresh
docker-compose down -v
docker-compose up --build
```

### Cannot Connect to MongoDB

```bash
# Check if MongoDB container is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

---

## 📝 What to Test

### Core Functionality

1. ✅ **Tenant Registration**
   - Creates tenant
   - Provisions database
   - Creates owner user
   - Returns JWT tokens

2. ✅ **User Login**
   - Validates credentials
   - Checks tenant status
   - Returns access + refresh tokens

3. ✅ **Token Refresh**
   - Refreshes expired access token
   - Validates refresh token

4. ✅ **Get User Profile**
   - Returns authenticated user info
   - Includes tenant details

5. ✅ **Multi-Tenant Isolation**
   - Each tenant has own database
   - Data completely isolated
   - Cross-tenant access prevented

---

## 🎯 Next Steps

### After Testing:

1. **Verify all endpoints work**
2. **Check MongoDB Express** - see databases created
3. **Review logs** - ensure no errors
4. **Test error cases** - invalid credentials, missing fields, etc.

### Then:

**Continue to Phase 2:**
- Product Management API
- POS System API
- Inventory Management

---

## 💡 Quick Reference

### Start Server
```
docker-compose up
```

### Test API
```
curl http://localhost:5000/api/health
```

### View Database
```
http://localhost:8081 (admin/admin123)
```

### Stop Server
```
docker-compose down
```

---

## ✅ YOU'RE ALL SET!

**Run this command now:**

```bash
cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms
docker-compose up
```

**Then test in another terminal:**

```bash
curl http://localhost:5000/api/health
```

---

**Status:** ✅ Ready to Run  
**Next:** `docker-compose up` 🚀  
**Phase:** 0 & 1 Complete, Ready for Phase 2!

