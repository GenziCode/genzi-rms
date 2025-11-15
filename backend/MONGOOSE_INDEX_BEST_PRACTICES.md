# Mongoose Index Best Practices

## Problem
Mongoose can create duplicate indexes when you define them in multiple places, leading to warnings like:
```
Warning: Duplicate schema index on {"fieldName":1} found.
```

## Solution: Choose ONE Method for Index Definition

### ❌ BAD: Don't mix field-level and schema-level index definitions

```typescript
// DON'T DO THIS - Creates duplicate indexes
const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,  // ❌ Creates an index automatically
  }
});

// ❌ This creates a duplicate index!
UserSchema.index({ email: 1 }, { unique: true });
```

### ✅ GOOD: Use ONLY schema-level index definitions

```typescript
// DO THIS - Clean and explicit
const UserSchema = new Schema({
  email: {
    type: String,
    // No index: true or unique: true here
  }
});

// ✅ Define ALL indexes explicitly in one place
UserSchema.index({ email: 1 }, { unique: true });
```

## Field Properties That Create Indexes

The following field properties automatically create indexes:

1. **`unique: true`** - Creates a unique index on the field
2. **`index: true`** - Creates a regular index on the field
3. **`sparse: true`** - Does NOT create an index by itself, but is often used with unique/index

## Rules to Follow

### Rule 1: Define All Indexes Explicitly
✅ **Always use `schema.index()` to define indexes**
```typescript
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
```

### Rule 2: Remove Field-Level Index Properties
❌ **Never use `index: true` or `unique: true` in field definitions**
```typescript
// Bad
sku: { type: String, unique: true }

// Good
sku: { type: String }
// Then add: ProductSchema.index({ sku: 1 }, { unique: true });
```

### Rule 3: Use Compound Indexes When Possible
```typescript
// Instead of multiple single-field indexes:
// ❌ tenantId: { index: true }
// ❌ status: { index: true }

// Use compound indexes:
// ✅
Schema.index({ tenantId: 1, status: 1 });
Schema.index({ tenantId: 1, createdAt: -1 });
```

### Rule 4: Keep Sparse Option in Schema-Level Index
```typescript
// For fields that can be null but must be unique if present:
clientId: {
  type: String,
  // No sparse: true here
}
// ✅ Add sparse in the index definition
Schema.index({ clientId: 1 }, { unique: true, sparse: true });
```

## Benefits of This Approach

1. **No Duplicate Indexes** - All indexes defined in one place
2. **Better Performance** - Optimal compound indexes
3. **Easier Maintenance** - All indexes visible in one section
4. **More Control** - Explicit control over index options

## Migration Checklist

When creating or updating a model:

- [ ] Remove all `index: true` from field definitions
- [ ] Remove all `unique: true` from field definitions  
- [ ] Remove all `sparse: true` from field definitions (unless needed for validation)
- [ ] Add explicit `schema.index()` calls after the schema definition
- [ ] Group indexes in a clear "Indexes" section with comments
- [ ] Test that indexes are created correctly
- [ ] Verify no duplicate index warnings in console

## Example: Complete Model

```typescript
import { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: Schema.Types.ObjectId;
  isActive: boolean;
}

export const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // ✅ No index properties here
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
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

// ✅ All indexes defined explicitly here
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text' });
ProductSchema.index({ isActive: 1 });
```

## References

- [Mongoose Indexes Documentation](https://mongoosejs.com/docs/guide.html#indexes)
- [MongoDB Index Documentation](https://docs.mongodb.com/manual/indexes/)





<<<<<<< HEAD






=======
>>>>>>> f6deffb2d31d09ece1fbf08beedb666e3c3242ca



