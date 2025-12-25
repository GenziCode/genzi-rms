# 🧪 Manual Testing Guide - Roles & Permissions

## ⚠️ **Browser Automation Unavailable**

Due to API rate limits, I cannot automate browser testing. Please follow these manual steps:

---

## 📋 **Manual Testing Steps**

### **Test 1: Check Permissions Tab**

1. **Open Browser**
   - Go to: `http://localhost:3000/roles-permissions`
   - If not logged in, login with:
     - Email: `haseeb@genzi-rms.com`
     - Password: `Hello1234`

2. **Open Developer Tools**
   - Press `F12`
   - Go to **Console** tab

3. **Click Permissions Tab**
   - Click on the "Permissions" tab in the page
   - Watch the console for logs

4. **Expected Console Output**:
   ```
   🔍 Fetching permissions...
   ✅ Permissions fetched: {product: Array(4), customer: Array(4), ...}
   📊 Modules: (15) ['category', 'customer', 'inventory', ...]
   📊 Total permissions: 58
   ✅ Permissions query success: {...}
   ```

5. **Expected UI**:
   - **If Success**: Module cards showing permissions
   - **If Loading**: Spinner with "Loading permissions..."
   - **If Error**: Red alert with error message
   - **If Empty**: "No permissions found" message

---

### **Test 2: Check Network Requests**

1. **Open Developer Tools** (F12)
2. **Go to Network Tab**
3. **Click Permissions Tab**
4. **Look for Request**:
   - URL: `http://localhost:5000/api/permissions/grouped`
   - Method: GET
   - Status: Should be **200**

5. **Check Request Headers**:
   - Should have: `Authorization: Bearer <token>`

6. **Check Response**:
   ```json
   {
     "success": true,
     "data": {
       "permissions": {
         "product": [...],
         "customer": [...],
         ...
       }
     }
   }
   ```

---

### **Test 3: Manual API Test**

1. **Open Browser Console** (F12 → Console)
2. **Run This Code**:
   ```javascript
   // Test permissions API
   const token = localStorage.getItem('token');
   console.log('Token exists:', !!token);
   
   if (token) {
     fetch('http://localhost:5000/api/permissions/grouped', {
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       }
     })
     .then(r => {
       console.log('Status:', r.status);
       return r.json();
     })
     .then(data => {
       console.log('Success:', data.success);
       if (data.data && data.data.permissions) {
         const modules = Object.keys(data.data.permissions);
         const total = Object.values(data.data.permissions).flat().length;
         console.log('✅ Modules:', modules.length);
         console.log('✅ Total Permissions:', total);
         console.log('Modules:', modules);
       } else {
         console.log('❌ No permissions in response');
         console.log('Response:', data);
       }
     })
     .catch(err => console.error('❌ Error:', err));
   } else {
     console.log('❌ No token found - please login');
   }
   ```

3. **Expected Output**:
   ```
   Token exists: true
   Status: 200
   Success: true
   ✅ Modules: 15
   ✅ Total Permissions: 58
   Modules: ['category', 'customer', 'inventory', ...]
   ```

---

### **Test 4: Test Edit Role**

1. **Go to Roles Tab**
2. **Click Edit** on "Administrator" role
3. **Click Permissions Tab** in the modal
4. **Check**:
   - Permission selector shows
   - All 15 modules visible
   - Can expand modules
   - Can select/deselect permissions
   - Search works

---

## 🔍 **Troubleshooting Based on Results**

### **Scenario 1: Console Shows "🔍 Fetching permissions..." but no success**

**Problem**: API call failing
**Check**:
1. Network tab - what's the status code?
2. Response tab - what's the error message?

**Common Fixes**:
- **401**: Not logged in → Re-login
- **403**: No permission → Check user role
- **404**: Endpoint not found → Backend not running
- **500**: Server error → Check backend logs

---

### **Scenario 2: Console Shows "✅ Permissions fetched" but UI shows empty**

**Problem**: Data not rendering
**Check**:
1. Console log - does it show modules?
2. React DevTools - check component state

**Fix**: Hard refresh (Ctrl+Shift+R)

---

### **Scenario 3: No console logs at all**

**Problem**: Query not running
**Check**:
1. Are you on the Permissions tab?
2. Is `canManageRoles` true?

**Fix**: Check user permissions

---

### **Scenario 4: "No permissions found" message**

**Problem**: Database empty
**Fix**:
```bash
cd backend
node seed-permissions.js
```

---

## 📸 **Screenshots to Take**

Please take these screenshots and share:

1. **Permissions Tab** - Full page view
2. **Browser Console** - Showing the logs
3. **Network Tab** - Showing the API request/response
4. **Edit Role Modal** - Permissions tab

---

## 🛠️ **Quick Fixes**

### **Fix 1: Re-seed Permissions**
```bash
cd backend
node seed-permissions.js
```

### **Fix 2: Verify Database**
```bash
cd backend
node check-permissions.js
```

### **Fix 3: Restart Backend**
```bash
cd backend
# Ctrl+C to stop
npm run dev
```

### **Fix 4: Clear Frontend Cache**
```
1. Hard refresh: Ctrl+Shift+R
2. Or clear all site data in DevTools
3. Re-login
```

---

## ✅ **Success Checklist**

- [ ] Console shows "🔍 Fetching permissions..."
- [ ] Console shows "✅ Permissions fetched"
- [ ] Console shows "📊 Total permissions: 58"
- [ ] Console shows "📊 Modules: (15) [...]"
- [ ] UI shows module cards
- [ ] Each module shows permission count
- [ ] Can expand modules
- [ ] Edit Role shows permission selector
- [ ] Permission selector has all modules
- [ ] Can search permissions

---

## 📝 **Report Template**

Please share these details:

**1. Console Output**:
```
[Paste console logs here]
```

**2. Network Request**:
- Status Code: 
- Response:
```
[Paste response here]
```

**3. What UI Shows**:
- [ ] Loading spinner
- [ ] Error message
- [ ] Empty state
- [ ] Module cards

**4. Screenshots**:
- Attach screenshots

---

**I'll analyze your results and provide specific fixes based on what you find!**
