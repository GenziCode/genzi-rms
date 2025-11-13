# 🔄 Offline Workflow & Sync Strategy

**Feature:** Offline-First POS System  
**Priority:** CRITICAL for retail/restaurant environments  
**Date:** November 10, 2024

---

## 🎯 Problem Statement

POS systems MUST work even when:

- Internet connection is lost
- Server is temporarily down
- Network is slow/unreliable

**Solution:** Offline-first architecture with background sync

---

## 🏗️ Architecture

### Client-Side (Frontend)

```
┌─────────────────┐
│   POS Interface │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IndexedDB      │ ← Local storage
│  (Offline DB)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Manager   │ ← Handles sync
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
└─────────────────┘
```

### Backend Support

```
New Endpoints:
- POST /api/sync/pull - Get updates since last sync
- POST /api/sync/push - Upload offline transactions
- GET /api/sync/status - Check sync status
- POST /api/sync/resolve-conflict - Handle conflicts
```

---

## 📋 Implementation Plan

### Phase 1: Backend Sync API (1 week)

#### 1. Sync Model

```typescript
interface ISyncLog {
  tenantId: ObjectId;
  userId: ObjectId;
  deviceId: string;

  lastSync: Date;
  syncType: 'pull' | 'push';

  itemsSynced: number;
  conflicts: number;

  status: 'success' | 'partial' | 'failed';
  errors?: any[];
}
```

#### 2. Offline Sale Model

```typescript
interface IOfflineSale {
  clientId: string; // UUID generated on client
  saleData: ISale;
  syncStatus: 'pending' | 'synced' | 'conflict';
  conflictReason?: string;
  createdAt: Date;
  syncedAt?: Date;
}
```

#### 3. API Endpoints to Build

- `POST /api/sync/products/pull` - Get all products for offline cache
- `POST /api/sync/sales/push` - Upload offline sales
- `GET /api/sync/status/:deviceId` - Get sync status
- `POST /api/sync/resolve/:clientId` - Resolve conflicts

### Phase 2: Conflict Resolution (3 days)

**Conflict Scenarios:**

1. **Stock conflict** - Product sold offline but also sold online

   - **Resolution:** Last-write-wins with stock validation
   - If stock insufficient, mark as conflict for manual review

2. **Price changed** - Product price changed while offline

   - **Resolution:** Use price at time of sale (from offline cache)

3. **Product deleted** - Product removed while offline
   - **Resolution:** Allow sale but mark product as archived

**Conflict Resolution Strategy:**

```javascript
// Server-side validation
if (
  offlineSale.items.some((item) => {
    const currentStock = getCurrentStock(item.productId);
    return currentStock < item.quantity;
  })
) {
  return {
    status: 'conflict',
    reason: 'insufficient_stock',
    action: 'manual_review',
  };
}
```

### Phase 3: Frontend Implementation (1 week)

**Technologies:**

- **IndexedDB** (via Dexie.js) - Local database
- **Service Worker** - Background sync
- **LocalStorage** - Settings & cache

**Data to Cache Offline:**

- Products (full catalog)
- Categories
- Current user info
- Store settings
- Pending transactions

**Sync Strategy:**

1. **On App Load:** Pull latest data
2. **While Online:** Direct API calls + cache update
3. **While Offline:** Save to IndexedDB
4. **On Reconnect:** Auto-sync pending transactions

---

## 🔧 Backend Changes Needed

### 1. Add Timestamp Tracking

```typescript
// All models need:
{
  syncVersion: Number,
  lastModified: Date
}
```

### 2. Batch Sync Endpoints

```typescript
POST /api/sync/pull
{
  "lastSync": "2024-11-10T12:00:00Z",
  "collections": ["products", "categories"]
}

Response:
{
  "products": [...],
  "categories": [...],
  "deletedIds": {
    "products": [...],
    "categories": [...]
  }
}
```

### 3. Validation Updates

```typescript
// Accept clientId for offline sales
POST /api/sales
{
  "clientId": "uuid-from-client", // optional
  "offlineCreatedAt": "2024-11-10T...", // optional
  ...
}
```

---

## 📦 Required Packages (Backend)

```bash
npm install uuid
```

---

## 🎯 MVP Offline Features

### Must Have (Week 1)

- ✅ Sync API endpoints
- ✅ Offline sale submission
- ✅ Basic conflict detection
- ✅ Stock validation

### Nice to Have (Week 2)

- ✅ Automatic retry on failure
- ✅ Detailed conflict resolution
- ✅ Sync progress tracking
- ✅ Manual conflict resolution UI

---

## 📊 Testing Strategy

### Offline Scenarios to Test

1. ✅ Create sale while offline
2. ✅ Multiple sales while offline
3. ✅ Reconnect and sync
4. ✅ Handle stock conflicts
5. ✅ Handle price changes
6. ✅ Handle deleted products

---

## ⚡ Quick Implementation (Backend Only)

**For now, we'll add:**

1. `clientId` support in Sale model
2. Bulk sync endpoints
3. Timestamp tracking
4. Conflict detection

**Frontend offline** will be implemented when building React app.

---

**Status:** Plan Ready - Implementation starts with Customer module first, then offline sync ✅
