# 🔧 Setup MongoDB & Redis for Windows

**Issue:** Backend cannot connect to MongoDB and Redis

**Solution:** Install and start both services

---

## 📥 OPTION 1: Install MongoDB

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: 7.0 or 8.0 (latest)
   - Platform: Windows
   - Package: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. **IMPORTANT:** Check "Install MongoDB as a Service"
4. Check "Install MongoDB Compass" (optional GUI)
5. Click Install

### Step 3: Verify MongoDB is Running

```bash
# Check if MongoDB service is running
sc query MongoDB

# Or check in Services (Win+R → services.msc)
# Look for "MongoDB" service - should be "Running"

# Test connection
mongosh

# Should connect and show:
# test>
```

### Step 4: If MongoDB is not starting

```bash
# Start MongoDB service
net start MongoDB

# Or using PowerShell (as Administrator)
Start-Service MongoDB
```

---

## 📥 OPTION 2: Install Redis

### Method A: Redis for Windows (Recommended)

1. Go to: https://github.com/tporadowski/redis/releases
2. Download latest `.msi` file (Redis-x64-X.X.XXX.msi)
3. Run installer
4. During installation:
   - Check "Add Redis to PATH"
   - Check "Add exception to Windows Firewall"
5. Install

### Step 2: Start Redis

```bash
# Redis should auto-start as a service
# Check if running:
sc query Redis

# Or start manually:
redis-server

# Test connection:
redis-cli ping
# Should return: PONG
```

### Method B: Use Memurai (Redis Alternative for Windows)

1. Go to: https://www.memurai.com/get-memurai
2. Download Memurai Developer Edition (Free)
3. Install
4. It runs as a Windows service automatically

Update `.env` file:
```
REDIS_URL=redis://localhost:6379
```

### Method C: Use WSL2 + Redis

If you have WSL2:

```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
redis-server

# In another terminal, test:
redis-cli ping
```

---

## ✅ VERIFICATION

### Check if MongoDB is Running

```bash
# Method 1: Check service
sc query MongoDB

# Method 2: Test connection
mongosh

# Should show:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# test>
```

### Check if Redis is Running

```bash
# Method 1: Check service
sc query Redis

# Method 2: Test connection
redis-cli ping

# Should return:
# PONG
```

---

## 🚀 AFTER INSTALLING BOTH

### Start Your Backend

```bash
cd /g/Haseeb-Projects/Candela-Lumensoft-Rayan-sdk-07-07-2024-v12.1.8.8/genzi-rms/backend

npm run dev
```

### You Should See:

```
2025-11-10 16:50:00 [info]: Starting Genzi RMS API Server...
2025-11-10 16:50:00 [info]: Environment: development
2025-11-10 16:50:00 [info]: Initializing database connections...
2025-11-10 16:50:01 [info]: Master database connected successfully
2025-11-10 16:50:01 [info]: ✅ Master database connected
2025-11-10 16:50:01 [info]: Initializing Redis...
2025-11-10 16:50:01 [info]: Redis client ready
2025-11-10 16:50:01 [info]: ✅ Redis connected
2025-11-10 16:50:01 [info]: Express app configured successfully
2025-11-10 16:50:01 [info]: ============================================================
2025-11-10 16:50:01 [info]: 🚀 Genzi RMS API Server running!
2025-11-10 16:50:01 [info]: 📍 URL: http://localhost:5000
2025-11-10 16:50:01 [info]: 📊 Environment: development
2025-11-10 16:50:01 [info]: ⏰ Started: ...
2025-11-10 16:50:01 [info]: ============================================================
```

### No more errors! ✅

---

## 🎯 Quick Links

**MongoDB Download:** https://www.mongodb.com/try/download/community  
**Redis for Windows:** https://github.com/tporadowski/redis/releases  
**Memurai (Redis alternative):** https://www.memurai.com/

---

## ⚡ FASTEST SOLUTION

If you want the **easiest setup**:

1. **Install Docker Desktop:** https://www.docker.com/products/docker-desktop/
2. **Restart your computer** (Docker requires this)
3. **Run:** `docker-compose up`

Docker will handle everything - no need to install MongoDB or Redis separately!

---

## 🔍 Troubleshooting

### MongoDB won't start

```bash
# Check error logs
# Windows Event Viewer → Windows Logs → Application
# Look for MongoDB errors

# Or check MongoDB logs at:
# C:\Program Files\MongoDB\Server\7.0\log\mongod.log
```

### Redis won't start

```bash
# Try running manually:
redis-server

# Should show:
# Ready to accept connections
```

### Still having issues?

**Install Docker Desktop** - it's the most reliable solution for development!

---

**Status:** Issue identified - MongoDB & Redis not running  
**Solution:** Install MongoDB & Redis OR Install Docker  
**Recommended:** Docker Desktop (easiest!)

