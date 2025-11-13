# 🚀 BACKEND START INSTRUCTIONS

## ⚠️ CRITICAL: Backend Server Not Running

The error `ERR_CONNECTION_REFUSED` means the backend server is not running on port 5000.

---

## ✅ HOW TO START THE BACKEND:

### **Option 1: Start Manually (RECOMMENDED)**

Open a **NEW TERMINAL WINDOW** and run:

```bash
cd genzi-rms/backend
npm run dev
```

**Watch for:**
- ✅ "Server running on port 5000"
- ✅ "MongoDB connected"
- ⚠️ Any error messages

---

## 🔍 POSSIBLE ISSUES & FIXES:

### **Issue 1: TypeScript Out of Memory**

If you see "heap out of memory" error:

**Fix:** Increase Node.js memory limit:

```bash
# Windows (PowerShell)
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# Or update package.json script:
"dev": "NODE_OPTIONS='--max-old-space-size=4096' ts-node-dev --respawn --transpile-only src/server.ts"
```

---

### **Issue 2: MongoDB Not Running**

If you see "MongoDB connection error":

**Fix:** Start MongoDB:

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB (Windows)
net start MongoDB

# Or start MongoDB manually
mongod --dbpath C:\data\db
```

---

### **Issue 3: Port 5000 Already in Use**

If you see "address already in use":

**Fix:** Kill the process using port 5000:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Then restart
npm run dev
```

---

### **Issue 4: Missing Dependencies**

If you see module errors:

**Fix:** Reinstall dependencies:

```bash
npm install
npm run dev
```

---

## ⚡ QUICK FIX: Skip TypeScript Compilation

If TypeScript compiler keeps crashing, use transpile-only mode:

**Update `package.json`:**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only --ignore-watch node_modules src/server.ts"
  }
}
```

Then:

```bash
npm run dev
```

---

## 📊 WHAT TO EXPECT WHEN SERVER STARTS:

```
[INFO] MongoDB connected: mongodb://localhost:27017/genzi-rms-master
[INFO] Email transporter initialized successfully
[WARN] Twilio credentials not configured. SMS functionality will be disabled.
[WARN] Stripe secret key not configured. Payment functionality will be disabled.
[INFO] Express app configured successfully
[INFO] Server running on http://localhost:5000
[INFO] Environment: development
```

**⚠️ Warnings are OK! Email/SMS/Stripe are optional - server will start without them.**

---

## ✅ VERIFY SERVER IS RUNNING:

Once server starts, test in **another terminal**:

```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-11T...",
    "uptime": 12.5,
    "environment": "development"
  }
}
```

---

## 🎯 AFTER SERVER STARTS:

1. ✅ Refresh frontend at http://localhost:3000
2. ✅ Network errors should be gone
3. ✅ Dashboard will load
4. ✅ All existing features work

---

## 🆘 IF STILL HAVING ISSUES:

**Please share the EXACT error message you see when running:**

```bash
cd genzi-rms/backend
npm run dev
```

I'll fix any startup errors immediately!

---

**Start the backend in a new terminal and let me know what errors you see!** 🚀

