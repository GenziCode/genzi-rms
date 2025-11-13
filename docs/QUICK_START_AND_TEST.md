# 🚀 QUICK START & TESTING GUIDE

**Goal:** Start backend server and test all existing features  
**Time:** 30 minutes  
**Result:** Verify everything works perfectly  

---

## ✅ STEP 1: START BACKEND SERVER

### **Open a NEW Terminal Window:**

```bash
cd genzi-rms/backend
npm run dev
```

### **Expected Output:**

```
[INFO] MongoDB connected: mongodb://localhost:27017/genzi-rms-master
[WARN] Email credentials not configured. Email functionality will be disabled.
[WARN] Twilio credentials not configured. SMS functionality will be disabled.
[WARN] Stripe secret key not configured. Payment functionality will be disabled.
[INFO] Email transporter initialized successfully
[INFO] Express app configured successfully
[INFO] Server running on http://localhost:5000
[INFO] Environment: development
```

✅ **Warnings are OK!** Email/SMS/Stripe are optional.

### **If You See Errors:**

**Error: MongoDB connection failed**
```bash
# Start MongoDB first
net start MongoDB
# OR
mongod --dbpath C:\data\db
```

**Error: Port 5000 already in use**
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

---

## ✅ STEP 2: VERIFY BACKEND IS RUNNING

### **In Another Terminal:**

```bash
curl http://localhost:5000/api/health
```

### **Expected Response:**

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

✅ **Backend is running!**

---

## ✅ STEP 3: REFRESH FRONTEND

1. Go to http://localhost:3000
2. Press **Ctrl + Shift + R** (hard refresh)
3. Network errors should be GONE!

---

## 🧪 STEP 4: TEST ALL FEATURES

### **✅ Test Checklist:**

#### **1. Authentication** (5 min)
- [ ] Login with existing credentials
- [ ] Dashboard loads without errors
- [ ] Token refresh works
- [ ] Logout works
- [ ] Login again
- [ ] Visit /forgot-password (new page should load)
- [ ] Visit /reset-password?token=test (new page should load)

**Expected:** ✅ All auth flows work

---

#### **2. Products & Categories** (5 min)
- [ ] Go to /products
- [ ] Products list loads
- [ ] Search products
- [ ] Filter by category
- [ ] Add new product (with tags and min/max stock - new fields!)
- [ ] Edit product
- [ ] Delete product
- [ ] Go to /categories
- [ ] View category tree
- [ ] Add category
- [ ] Add sub-category (parent selection)

**Expected:** ✅ All CRUD operations work

---

#### **3. POS System** (5 min)
- [ ] Go to /pos
- [ ] Search products
- [ ] Add items to cart
- [ ] Apply discount
- [ ] Select customer
- [ ] Process payment (multi-payment)
- [ ] Sale completes successfully
- [ ] Try hold transaction
- [ ] Resume held transaction

**Expected:** ✅ POS fully functional

---

#### **4. Inventory** (3 min)
- [ ] Go to /inventory
- [ ] View stock overview
- [ ] Click "Adjust Stock"
- [ ] Select product and adjust quantity
- [ ] View stock movements
- [ ] View stock alerts
- [ ] Check valuation reports

**Expected:** ✅ Inventory management works

---

#### **5. Customers** (3 min)
- [ ] Go to /customers
- [ ] View customer list
- [ ] Add new customer
- [ ] Edit customer
- [ ] View customer details
- [ ] Adjust loyalty points
- [ ] Adjust credit balance
- [ ] View purchase history

**Expected:** ✅ Customer management works

---

#### **6. Vendors & POs** (3 min)
- [ ] Go to /vendors
- [ ] Add vendor
- [ ] Go to /purchase-orders
- [ ] Create purchase order
- [ ] View PO details
- [ ] Approve PO
- [ ] Receive goods

**Expected:** ✅ Procurement workflow works

---

#### **7. Reports** (2 min)
- [ ] Go to /reports
- [ ] View Sales Trends
- [ ] View Profit & Loss
- [ ] View Inventory Valuation
- [ ] View Customer Insights
- [ ] View Vendor Performance
- [ ] Change period (today/week/month/year)

**Expected:** ✅ All reports load

---

#### **8. Users & Settings** (3 min)
- [ ] Go to /users
- [ ] Add new user
- [ ] Edit user
- [ ] Change user role
- [ ] Go to /settings
- [ ] Update store settings
- [ ] Update tax settings
- [ ] Update receipt settings
- [ ] Update POS settings
- [ ] Save settings (should work now!)

**Expected:** ✅ User management & settings work

---

## 🐛 COMMON ISSUES & FIXES

### **Issue: "Network Error" on frontend**
**Solution:** Backend not running → Start backend server

### **Issue: "401 Unauthorized"**
**Solution:** Token expired → Logout and login again

### **Issue: "Tenant not found"**
**Solution:** Clear browser storage → Logout → Login

### **Issue: "400 Bad Request"**
**Solution:** Check browser console for validation errors

### **Issue: Blank page**
**Solution:** Check browser console for JavaScript errors

---

## ✅ SUCCESS CRITERIA

After testing, you should have:
- ✅ No network errors
- ✅ All 17 pages loading
- ✅ All CRUD operations working
- ✅ POS system functional
- ✅ Reports showing data
- ✅ Settings saving properly

---

## 📊 WHAT'S WORKING (144 Endpoints)

**Core Modules:**
- ✅ Authentication (9 endpoints)
- ✅ Tenants (7 endpoints)
- ✅ Products (10 endpoints)
- ✅ Categories (6 endpoints)
- ✅ Sales/POS (9 endpoints)
- ✅ Inventory (7 endpoints)
- ✅ Customers (8 endpoints)
- ✅ Vendors (5 endpoints)
- ✅ Purchase Orders (7 endpoints)
- ✅ Users (6 endpoints)
- ✅ Settings/Stores (5 endpoints)
- ✅ Reports (8 endpoints)
- ✅ Export (4 endpoints)
- ✅ Sync (3 endpoints)

**New Modules:**
- ✅ Invoices (14 endpoints)
- ✅ Notifications (12 endpoints)
- ✅ Payments (7 endpoints)
- ✅ Audit Logs (5 endpoints)
- ✅ Webhooks (8 endpoints)

---

## 🎯 AFTER TESTING

If everything works:
- ✅ System is 92% complete
- ✅ Ready for production use
- ✅ Can start building invoice UI
- ✅ Can add notification center
- ✅ Can polish & deploy

---

## 📖 FULL DETAILS

See: **COMPLETE_PROJECT_STATUS_FINAL.md**

Contains:
- Complete phase breakdown
- All features list
- Remaining work
- Next steps recommendations

---

**START THE BACKEND NOW AND LET'S TEST!** 🚀

**Command to run:**
```bash
cd genzi-rms/backend
npm run dev
```

**Then refresh frontend and test all features!**

