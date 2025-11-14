# 🚀 PHASE 1 RBAC - IMPLEMENTATION START GUIDE
## Safe Step-by-Step Implementation Plan

**Created:** 2025-01-13 15:00:00 UTC  
**Last Updated:** 2025-01-13 15:00:00 UTC  
**Status:** 🔴 READY TO START

---

## ⚠️ CRITICAL PRINCIPLES

1. **NO CODEBASE BREAKAGE** - All changes must be backward compatible
2. **TEST FIRST** - Verify server runs before and after each step
3. **INCREMENTAL** - One small change at a time, test, then proceed
4. **BACKWARD COMPATIBLE** - Existing `role` field continues to work
5. **ROLLBACK READY** - Each step can be reverted independently

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before starting, ensure:

- [ ] **Server is running** (`npm run dev` in backend folder)
- [ ] **Database connection works** (`npm run test:connection`)
- [ ] **Existing tests pass** (`npm test`)
- [ ] **No TypeScript errors** (`npm run type-check`)
- [ ] **Git branch created** (`git checkout -b feature/rbac-phase1`)
- [ ] **Backup database** (or use test database)

---

## 🎯 STEP-BY-STEP IMPLEMENTATION PLAN

### **STEP 0: PRE-FLIGHT CHECKS** ✅

**Goal:** Verify current system works before making changes

**Actions:**
1. Start backend server: `cd backend && npm run dev`
2. Test health endpoint: `curl http://localhost:5000/api/health`
3. Test authentication: Login with existing user
4. Run type check: `npm run type-check`
5. Run tests: `npm test`

**Expected Result:** ✅ All checks pass, server runs without errors

**If errors found:** 🔴 **STOP** - Fix all errors before proceeding

**Time:** 15 minutes

---

### **STEP 1: CREATE ROLE MODEL** (Task 1.1)

**Goal:** Create new Role model without breaking existing code

**File:** `backend/src/models/role.model.ts`

**Implementation Strategy:**
- Create NEW model (doesn't affect existing User model)
- Use separate collection: `roles`
- No changes to existing code

**Steps:**

1. **Create the file:**
   ```bash
   touch backend/src/models/role.model.ts
   ```

2. **Write the model** (see implementation below)

3. **Test:**
   - Import in a test file
   - Verify TypeScript compiles
   - Check no runtime errors

**Validation:**
- [ ] File created
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Server starts (`npm run dev`)
- [ ] No errors in console
- [ ] Can import model: `import { RoleSchema } from './models/role.model'`

**Rollback:** Delete the file if issues occur

**Time:** 30 minutes

---

### **STEP 2: CREATE PERMISSION REGISTRY MODEL** (Task 1.2)

**Goal:** Create Permission registry model

**File:** `backend/src/models/permission.model.ts`

**Implementation Strategy:**
- New model, separate collection
- No dependencies on existing code
- Can be created independently

**Steps:**

1. Create the file
2. Write the model
3. Test compilation and server start

**Validation:**
- [ ] TypeScript compiles
- [ ] Server starts
- [ ] Can import model

**Rollback:** Delete the file

**Time:** 30 minutes

---

### **STEP 3: CREATE ROLE ASSIGNMENT MODEL** (Task 1.3)

**Goal:** Create RoleAssignment model for tracking user-role relationships

**File:** `backend/src/models/roleAssignment.model.ts`

**Implementation Strategy:**
- New model, separate collection
- References User and Role (but doesn't break existing User)
- Can exist alongside existing `user.role` field

**Steps:**

1. Create the file
2. Write the model
3. Test compilation

**Validation:**
- [ ] TypeScript compiles
- [ ] Server starts
- [ ] No errors

**Rollback:** Delete the file

**Time:** 30 minutes

---

### **STEP 4: UPDATE USER MODEL SAFELY** (Task 1.4)

**Goal:** Add new fields to User model WITHOUT breaking existing code

**File:** `backend/src/models/user.model.ts`

**⚠️ CRITICAL:** This is the first change to existing code. Must be backward compatible.

**Implementation Strategy:**
- Add `roles` array (optional, defaults to empty)
- Add `scope` field (optional)
- Add `delegatedFrom` field (optional)
- **KEEP** existing `role` field (for backward compatibility)
- **KEEP** existing `permissions` array

**Changes:**
```typescript
// ADD these fields (all optional with defaults)
roles: {
  type: [Schema.Types.ObjectId],
  ref: 'Role',
  default: [],
},
scope: {
  type: {
    type: String,
    enum: ['all', 'store', 'department', 'custom'],
    default: 'all',
  },
  storeIds: [Schema.Types.ObjectId],
  departmentIds: [Schema.Types.ObjectId],
  customFilters: Schema.Types.Mixed,
},
delegatedFrom: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  default: null,
},
```

**Steps:**

1. **Backup current file:**
   ```bash
   cp backend/src/models/user.model.ts backend/src/models/user.model.ts.backup
   ```

2. **Add new fields** (see implementation below)

3. **Test immediately:**
   - TypeScript compiles
   - Server starts
   - Existing login works
   - Existing user queries work

**Validation:**
- [ ] TypeScript compiles
- [ ] Server starts without errors
- [ ] Existing login endpoint works
- [ ] Existing user queries return data
- [ ] No breaking changes to existing API responses

**If errors:** 🔴 **STOP** - Restore backup and fix

**Rollback:** Restore backup file

**Time:** 45 minutes

---

### **STEP 5: CREATE MIGRATION SCRIPT** (Task 1.5)

**Goal:** Create migration script to initialize RBAC data

**File:** `backend/src/migrations/001-rbac-initial.ts`

**Implementation Strategy:**
- Script runs independently
- Doesn't modify existing user data
- Can be run multiple times safely (idempotent)

**Steps:**

1. Create migrations folder: `mkdir -p backend/src/migrations`
2. Create migration script
3. Test script runs without errors
4. **DO NOT RUN** on production yet

**Validation:**
- [ ] Script compiles
- [ ] Script runs without errors (on test DB)
- [ ] Creates roles and permissions
- [ ] Doesn't modify existing users

**Rollback:** Delete migration file

**Time:** 1 hour

---

### **STEP 6: TEST COMPLETE FLOW**

**Goal:** Verify all models work together

**Tests:**

1. **Create a Role:**
   ```typescript
   const role = await Role.create({ name: 'Test Role', code: 'test_role' });
   ```

2. **Create a Permission:**
   ```typescript
   const permission = await Permission.create({ code: 'product:create', module: 'product', action: 'create' });
   ```

3. **Assign Role to User (new way):**
   ```typescript
   user.roles.push(role._id);
   await user.save();
   ```

4. **Verify existing role still works:**
   ```typescript
   user.role === 'cashier' // Should still work
   ```

**Validation:**
- [ ] All models can be created
- [ ] User model accepts new fields
- [ ] Existing `user.role` still works
- [ ] No breaking changes

**Time:** 30 minutes

---

## 🔧 IMPLEMENTATION DETAILS

### Role Model Structure

```typescript
// backend/src/models/role.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string; // Unique identifier (e.g., 'admin', 'manager')
  description?: string;
  category: 'system' | 'custom';
  parentRole?: mongoose.Types.ObjectId;
  permissions: mongoose.Types.ObjectId[];
  scope: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: mongoose.Types.ObjectId[];
    departmentIds?: mongoose.Types.ObjectId[];
    customFilters?: any;
  };
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['system', 'custom'],
      default: 'custom',
    },
    parentRole: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission',
    }],
    scope: {
      type: {
        type: String,
        enum: ['all', 'store', 'department', 'custom'],
        default: 'all',
      },
      storeIds: [Schema.Types.ObjectId],
      departmentIds: [Schema.Types.ObjectId],
      customFilters: Schema.Types.Mixed,
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoleSchema.index({ tenantId: 1, code: 1 }, { unique: true });
RoleSchema.index({ tenantId: 1, isActive: 1 });
RoleSchema.index({ parentRole: 1 });

export { RoleSchema };
```

### Permission Model Structure

```typescript
// backend/src/models/permission.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  code: string; // Unique identifier (e.g., 'product:create', 'user:read')
  name: string;
  module: string; // e.g., 'product', 'user', 'inventory'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  description?: string;
  category: 'crud' | 'action' | 'report' | 'admin';
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['crud', 'action', 'report', 'admin'],
      default: 'crud',
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PermissionSchema.index({ code: 1 }, { unique: true });
PermissionSchema.index({ module: 1, action: 1 });
PermissionSchema.index({ category: 1 });

export { PermissionSchema };
```

### RoleAssignment Model Structure

```typescript
// backend/src/models/roleAssignment.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleAssignment extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  scopeOverride?: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: mongoose.Types.ObjectId[];
    departmentIds?: mongoose.Types.ObjectId[];
    customFilters?: any;
  };
  delegatedFrom?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleAssignmentSchema = new Schema<IRoleAssignment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    roleId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Role',
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    scopeOverride: {
      type: {
        type: String,
        enum: ['all', 'store', 'department', 'custom'],
      },
      storeIds: [Schema.Types.ObjectId],
      departmentIds: [Schema.Types.ObjectId],
      customFilters: Schema.Types.Mixed,
    },
    delegatedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RoleAssignmentSchema.index({ tenantId: 1, userId: 1, roleId: 1 });
RoleAssignmentSchema.index({ userId: 1, isActive: 1 });
RoleAssignmentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export { RoleAssignmentSchema };
```

### User Model Updates (Backward Compatible)

```typescript
// Add to existing UserSchema in backend/src/models/user.model.ts

// ADD these fields AFTER existing fields (around line 81)
roles: {
  type: [Schema.Types.ObjectId],
  ref: 'Role',
  default: [],
},
scope: {
  type: {
    type: String,
    enum: ['all', 'store', 'department', 'custom'],
    default: 'all',
  },
  storeIds: [Schema.Types.ObjectId],
  departmentIds: [Schema.Types.ObjectId],
  customFilters: Schema.Types.Mixed,
},
delegatedFrom: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  default: null,
},

// ADD index for roles lookup
UserSchema.index({ tenantId: 1, roles: 1 });
```

---

## ✅ VALIDATION CHECKLIST

After each step, verify:

- [ ] **TypeScript compiles:** `npm run type-check`
- [ ] **Server starts:** `npm run dev` (no errors)
- [ ] **Existing endpoints work:** Test login, user queries
- [ ] **No breaking changes:** Existing API responses unchanged
- [ ] **Database queries work:** Can query users, roles, permissions
- [ ] **No console errors:** Check server logs

---

## 🚨 TROUBLESHOOTING

### If server won't start:

1. **Check TypeScript errors:**
   ```bash
   npm run type-check
   ```

2. **Check import paths:**
   - Verify all imports are correct
   - Check file paths match

3. **Check database connection:**
   ```bash
   npm run test:connection
   ```

4. **Check for circular dependencies:**
   - Models shouldn't import each other circularly

### If existing endpoints break:

1. **Restore backup:**
   ```bash
   cp backend/src/models/user.model.ts.backup backend/src/models/user.model.ts
   ```

2. **Check what changed:**
   - Review git diff
   - Identify breaking change

3. **Fix incrementally:**
   - Make smaller changes
   - Test after each change

---

## 📝 NEXT STEPS AFTER STEP 6

Once all models are created and tested:

1. **Week 2:** Create Permission Service and Role Service
2. **Week 3:** Implement Form-Level Permissions
3. **Week 4:** Implement Field-Level Permissions
4. **Week 5:** Build Role Management UI
5. **Week 6:** Implement Data Scope & Policies

---

## 🔄 UPDATE LOG

| Date | Time (UTC) | Changes | Updated By |
|------|------------|---------|------------|
| 2025-01-13 | 15:00:00 | Implementation start guide created | System Analysis |

---

**Next Review:** After Step 0 completion  
**Status:** 🔴 READY TO START

