# 🔧 Troubleshooting Guide - Genzi RMS Backend

## ❌ Error: Cannot Connect to MongoDB/Redis

### Error Message:
```
AggregateError
at internalConnectMultiple (node:net:1114:18)
```

### **Cause:**
MongoDB and/or Redis are not running.

### **Solution:**

#### Option 1: Use Docker (EASIEST) ⭐

Docker will automatically start MongoDB and Redis for you:

```bash
# Make sure Docker Desktop is running
# Then from genzi-rms directory:

cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms

# Stop any running npm dev server first (Ctrl+C)

# Start with Docker
docker-compose up
```

**Docker starts:**
- ✅ MongoDB on port 27017
- ✅ Redis on port 6379
- ✅ Backend API on port 5000
- ✅ MongoDB Express GUI on port 8081

---

#### Option 2: Install MongoDB & Redis Locally

**Install MongoDB:**
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB 6.x or 7.x
3. Start MongoDB:
   ```bash
   # Windows (as service - usually auto-starts)
   net start MongoDB
   
   # Or manually
   mongod
   ```

**Install Redis:**
1. Download for Windows: https://github.com/microsoftarchive/redis/releases
2. Or use WSL/Docker
3. Start Redis:
   ```bash
   redis-server
   ```

**Then start backend:**
```bash
cd backend
npm run dev
```

---

## ⚠️ Mongoose Warning: Duplicate Index

### Error Message:
```
Warning: Duplicate schema index on {"subdomain":1}
Warning: Duplicate schema index on {"customDomain":1}
```

### **Status:** ✅ FIXED

I've removed the duplicate index definitions. The warnings should no longer appear.

---

## 🔍 How to Verify Everything is Working

### 1. Check if MongoDB is Running

```bash
# Using Docker
docker-compose ps

# Should show mongo container running

# Or locally
mongosh
# Should connect without error
```

### 2. Check if Redis is Running

```bash
# Using Docker
docker-compose exec redis redis-cli ping
# Should return: PONG

# Or locally
redis-cli ping
# Should return: PONG
```

### 3. Check Backend Logs

```bash
# Using Docker
docker-compose logs backend

# Look for:
# "✅ Master database connected"
# "✅ Redis connected"
# "🚀 Genzi RMS API Server running!"
```

---

## 🐳 Docker Specific Issues

### Issue: "Cannot start service"

```bash
# Stop everything
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

### Issue: "Port already in use"

```bash
# Find what's using the port
netstat -ano | findstr :5000

# Kill the process
taskkill /PID {PID} /F

# Or change port in .env
PORT=5001
```

### Issue: Docker not starting

```bash
# Make sure Docker Desktop is running
# On Windows, check system tray

# Restart Docker Desktop
# Then try again:
docker-compose up
```

---

## 📊 Connection Status Check

### Test MongoDB Connection

```bash
# From genzi-rms directory
docker-compose exec mongo mongosh

# Once connected:
show dbs
# Should show genzi_master and any tenant databases

exit
```

### Test Redis Connection

```bash
docker-compose exec redis redis-cli

# Once connected:
PING
# Should return: PONG

exit
```

### Test Backend API

```bash
curl http://localhost:5000/api/health

# Should return:
# {"success":true,"data":{"status":"healthy",...}}
```

---

## 🔄 Common Workflow

### Starting Fresh

```bash
# 1. Stop everything
docker-compose down -v

# 2. Start everything
docker-compose up

# 3. Wait for logs to show:
#    "✅ Master database connected"
#    "✅ Redis connected"
#    "🚀 Genzi RMS API Server running!"

# 4. Test in another terminal
curl http://localhost:5000/api/health
```

---

## 📝 Environment Issues

### If .env is missing or incorrect

```bash
cd backend

# Check if .env exists
ls -la .env

# If missing, create it:
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MASTER_DB_URI=mongodb://localhost:27017/genzi_master
TENANT_DB_BASE_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=dev-cookie-secret
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=debug
APP_DOMAIN=localhost
EOF
```

---

## ✅ Recommended Solution

**Use Docker - it handles everything automatically:**

```bash
# From genzi-rms directory
docker-compose up

# Wait for all services to start (15-30 seconds)

# Test in another terminal
curl http://localhost:5000/api/health
```

**That's it!** Docker will:
1. Start MongoDB
2. Start Redis
3. Start Backend API
4. Handle all connections automatically

---

## 📞 Still Having Issues?

### Check Docker Status
```bash
docker --version
docker-compose --version
docker ps
```

### View All Logs
```bash
docker-compose logs
```

### Restart Everything
```bash
docker-compose down
docker-compose up --build
```

---

**Status:** ✅ Issues identified and fixed  
**Next:** Run `docker-compose up` and test!

