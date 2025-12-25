import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { RoleSchema } from '../models/role.model';
import { PermissionSchema } from '../models/permission.model';
import { RoleAssignmentSchema } from '../models/roleAssignment.model';

// Load environment variables
dotenv.config();

/**
 * RBAC Initial Migration
 * Creates RBAC collections and seeds default roles and permissions
 * This script is idempotent - can be run multiple times safely
 */

interface PermissionSeed {
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
  category: 'crud' | 'action' | 'report' | 'admin';
}

interface RoleSeed {
  code: string;
  name: string;
  description: string;
  category: 'system' | 'custom';
  isSystemRole: boolean;
  permissionCodes: string[];
}

/**
 * Default permissions to seed
 * Based on existing modules in the codebase
 */
const DEFAULT_PERMISSIONS: PermissionSeed[] = [
  // Product Permissions
  { code: 'product:create', name: 'Create Product', module: 'product', action: 'create', description: 'Create new products', category: 'crud' },
  { code: 'product:read', name: 'Read Product', module: 'product', action: 'read', description: 'View products', category: 'crud' },
  { code: 'product:update', name: 'Update Product', module: 'product', action: 'update', description: 'Update products', category: 'crud' },
  { code: 'product:delete', name: 'Delete Product', module: 'product', action: 'delete', description: 'Delete products', category: 'crud' },

  // Customer Permissions
  { code: 'customer:create', name: 'Create Customer', module: 'customer', action: 'create', description: 'Create new customers', category: 'crud' },
  { code: 'customer:read', name: 'Read Customer', module: 'customer', action: 'read', description: 'View customers', category: 'crud' },
  { code: 'customer:update', name: 'Update Customer', module: 'customer', action: 'update', description: 'Update customers', category: 'crud' },
  { code: 'customer:delete', name: 'Delete Customer', module: 'customer', action: 'delete', description: 'Delete customers', category: 'crud' },

  // Vendor Permissions
  { code: 'vendor:create', name: 'Create Vendor', module: 'vendor', action: 'create', description: 'Create new vendors', category: 'crud' },
  { code: 'vendor:read', name: 'Read Vendor', module: 'vendor', action: 'read', description: 'View vendors', category: 'crud' },
  { code: 'vendor:update', name: 'Update Vendor', module: 'vendor', action: 'update', description: 'Update vendors', category: 'crud' },
  { code: 'vendor:delete', name: 'Delete Vendor', module: 'vendor', action: 'delete', description: 'Delete vendors', category: 'crud' },

  // Purchase Order Permissions
  { code: 'purchaseOrder:create', name: 'Create Purchase Order', module: 'purchaseOrder', action: 'create', description: 'Create purchase orders', category: 'crud' },
  { code: 'purchaseOrder:read', name: 'Read Purchase Order', module: 'purchaseOrder', action: 'read', description: 'View purchase orders', category: 'crud' },
  { code: 'purchaseOrder:update', name: 'Update Purchase Order', module: 'purchaseOrder', action: 'update', description: 'Update purchase orders', category: 'crud' },
  { code: 'purchaseOrder:delete', name: 'Delete Purchase Order', module: 'purchaseOrder', action: 'delete', description: 'Delete purchase orders', category: 'crud' },
  { code: 'purchaseOrder:approve', name: 'Approve Purchase Order', module: 'purchaseOrder', action: 'approve', description: 'Approve purchase orders', category: 'action' },

  // Inventory Permissions
  { code: 'inventory:read', name: 'Read Inventory', module: 'inventory', action: 'read', description: 'View inventory', category: 'crud' },
  { code: 'inventory:update', name: 'Update Inventory', module: 'inventory', action: 'update', description: 'Update inventory levels', category: 'crud' },
  { code: 'inventory:transfer', name: 'Transfer Inventory', module: 'inventory', action: 'transfer', description: 'Transfer inventory between stores', category: 'action' },
  { code: 'inventory:adjust', name: 'Adjust Inventory', module: 'inventory', action: 'adjust', description: 'Adjust inventory counts', category: 'action' },

  // POS Permissions
  { code: 'pos:sale', name: 'Process Sale', module: 'pos', action: 'sale', description: 'Process sales transactions', category: 'action' },
  { code: 'pos:refund', name: 'Process Refund', module: 'pos', action: 'refund', description: 'Process refunds', category: 'action' },
  { code: 'pos:void', name: 'Void Transaction', module: 'pos', action: 'void', description: 'Void transactions', category: 'action' },
  { code: 'pos:read', name: 'Read POS', module: 'pos', action: 'read', description: 'View POS transactions', category: 'crud' },

  // Invoice Permissions
  { code: 'invoice:create', name: 'Create Invoice', module: 'invoice', action: 'create', description: 'Create invoices', category: 'crud' },
  { code: 'invoice:read', name: 'Read Invoice', module: 'invoice', action: 'read', description: 'View invoices', category: 'crud' },
  { code: 'invoice:update', name: 'Update Invoice', module: 'invoice', action: 'update', description: 'Update invoices', category: 'crud' },
  { code: 'invoice:delete', name: 'Delete Invoice', module: 'invoice', action: 'delete', description: 'Delete invoices', category: 'crud' },
  { code: 'invoice:print', name: 'Print Invoice', module: 'invoice', action: 'print', description: 'Print invoices', category: 'action' },

  // Payment Permissions
  { code: 'payment:create', name: 'Create Payment', module: 'payment', action: 'create', description: 'Record payments', category: 'crud' },
  { code: 'payment:read', name: 'Read Payment', module: 'payment', action: 'read', description: 'View payments', category: 'crud' },
  { code: 'payment:update', name: 'Update Payment', module: 'payment', action: 'update', description: 'Update payments', category: 'crud' },
  { code: 'payment:delete', name: 'Delete Payment', module: 'payment', action: 'delete', description: 'Delete payments', category: 'crud' },

  // Store Permissions
  { code: 'store:create', name: 'Create Store', module: 'store', action: 'create', description: 'Create stores', category: 'crud' },
  { code: 'store:read', name: 'Read Store', module: 'store', action: 'read', description: 'View stores', category: 'crud' },
  { code: 'store:update', name: 'Update Store', module: 'store', action: 'update', description: 'Update stores', category: 'crud' },
  { code: 'store:delete', name: 'Delete Store', module: 'store', action: 'delete', description: 'Delete stores', category: 'crud' },

  // Category Permissions
  { code: 'category:create', name: 'Create Category', module: 'category', action: 'create', description: 'Create categories', category: 'crud' },
  { code: 'category:read', name: 'Read Category', module: 'category', action: 'read', description: 'View categories', category: 'crud' },
  { code: 'category:update', name: 'Update Category', module: 'category', action: 'update', description: 'Update categories', category: 'crud' },
  { code: 'category:delete', name: 'Delete Category', module: 'category', action: 'delete', description: 'Delete categories', category: 'crud' },

  // User Permissions
  { code: 'user:create', name: 'Create User', module: 'user', action: 'create', description: 'Create users', category: 'crud' },
  { code: 'user:read', name: 'Read User', module: 'user', action: 'read', description: 'View users', category: 'crud' },
  { code: 'user:update', name: 'Update User', module: 'user', action: 'update', description: 'Update users', category: 'crud' },
  { code: 'user:delete', name: 'Delete User', module: 'user', action: 'delete', description: 'Delete users', category: 'crud' },

  // Role Permissions
  { code: 'role:create', name: 'Create Role', module: 'role', action: 'create', description: 'Create roles', category: 'admin' },
  { code: 'role:read', name: 'Read Role', module: 'role', action: 'read', description: 'View roles', category: 'admin' },
  { code: 'role:update', name: 'Update Role', module: 'role', action: 'update', description: 'Update roles', category: 'admin' },
  { code: 'role:delete', name: 'Delete Role', module: 'role', action: 'delete', description: 'Delete roles', category: 'admin' },

  // Tenant Permissions
  { code: 'tenant:read', name: 'Read Tenant', module: 'tenant', action: 'read', description: 'View tenant settings', category: 'admin' },
  { code: 'tenant:update', name: 'Update Tenant', module: 'tenant', action: 'update', description: 'Update tenant settings', category: 'admin' },

  // Reports Permissions
  { code: 'report:sales', name: 'Sales Reports', module: 'report', action: 'sales', description: 'View sales reports', category: 'report' },
  { code: 'report:inventory', name: 'Inventory Reports', module: 'report', action: 'inventory', description: 'View inventory reports', category: 'report' },
  { code: 'report:financial', name: 'Financial Reports', module: 'report', action: 'financial', description: 'View financial reports', category: 'report' },
  { code: 'report:custom', name: 'Custom Reports', module: 'report', action: 'custom', description: 'Create custom reports', category: 'report' },

  // Settings Permissions
  { code: 'settings:read', name: 'Read Settings', module: 'settings', action: 'read', description: 'View settings', category: 'admin' },
  { code: 'settings:update', name: 'Update Settings', module: 'settings', action: 'update', description: 'Update settings', category: 'admin' },
];

/**
 * Default system roles to seed
 */
const DEFAULT_ROLES: RoleSeed[] = [
  {
    code: 'owner',
    name: 'Owner',
    description: 'Full system access, all permissions',
    category: 'system',
    isSystemRole: true,
    permissionCodes: ['*'], // All permissions
  },
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Administrative access, can manage users and settings',
    category: 'system',
    isSystemRole: true,
    permissionCodes: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'role:create', 'role:read', 'role:update', 'role:delete',
      'tenant:read', 'tenant:update',
      'settings:read', 'settings:update',
      'product:*', 'customer:*', 'vendor:*', 'store:*', 'category:*',
      'inventory:*', 'purchaseOrder:*', 'invoice:*', 'payment:*',
      'pos:*', 'report:*',
    ],
  },
  {
    code: 'manager',
    name: 'Manager',
    description: 'Management access, can manage operations',
    category: 'system',
    isSystemRole: true,
    permissionCodes: [
      'product:*', 'customer:*', 'vendor:*', 'store:read', 'category:*',
      'inventory:*', 'purchaseOrder:*', 'invoice:*', 'payment:*',
      'pos:*', 'report:*', 'user:read', 'settings:read',
    ],
  },
  {
    code: 'cashier',
    name: 'Cashier',
    description: 'POS and sales access',
    category: 'system',
    isSystemRole: true,
    permissionCodes: [
      'pos:*', 'product:read', 'customer:read', 'customer:create',
      'invoice:read', 'invoice:create', 'invoice:print',
      'payment:create', 'payment:read',
    ],
  },
  {
    code: 'inventory_clerk',
    name: 'Inventory Clerk',
    description: 'Inventory management access',
    category: 'system',
    isSystemRole: true,
    permissionCodes: [
      'inventory:*', 'product:read', 'product:update',
      'purchaseOrder:read', 'store:read',
    ],
  },
];

/**
 * Seed permissions
 */
async function seedPermissions(connection: mongoose.Connection): Promise<Map<string, mongoose.Types.ObjectId>> {
  logger.info('Seeding permissions...');
  const Permission = connection.model('Permission', PermissionSchema);
  const permissionMap = new Map<string, mongoose.Types.ObjectId>();

  for (const perm of DEFAULT_PERMISSIONS) {
    const existing = await Permission.findOne({ code: perm.code });
    if (existing) {
      logger.info(`  ⏭️  Permission already exists: ${perm.code}`);
      permissionMap.set(perm.code, existing._id as mongoose.Types.ObjectId);
    } else {
      const created = await Permission.create({
        ...perm,
        isSystem: true,
      });
      logger.info(`  ✅ Created permission: ${perm.code}`);
      permissionMap.set(perm.code, created._id as mongoose.Types.ObjectId);
    }
  }

  logger.info(`✅ Permissions seeded: ${permissionMap.size} permissions`);
  return permissionMap;
}

/**
 * Seed roles
 */
async function seedRoles(
  connection: mongoose.Connection,
  permissionMap: Map<string, mongoose.Types.ObjectId>
): Promise<void> {
  logger.info('Seeding roles...');
  const Role = connection.model('Role', RoleSchema);

  for (const roleSeed of DEFAULT_ROLES) {
    // Get permission IDs for this role
    let permissionIds: mongoose.Types.ObjectId[] = [];

    if (roleSeed.permissionCodes.includes('*')) {
      // All permissions
      permissionIds = Array.from(permissionMap.values());
    } else {
      // Specific permissions
      for (const permCode of roleSeed.permissionCodes) {
        if (permCode.endsWith(':*')) {
          // Wildcard permission (e.g., 'product:*')
          const module = permCode.replace(':*', '');
          const modulePerms = Array.from(permissionMap.entries())
            .filter(([code]) => code.startsWith(`${module}:`))
            .map(([, id]) => id);
          permissionIds.push(...modulePerms);
        } else {
          const permId = permissionMap.get(permCode);
          if (permId) {
            permissionIds.push(permId);
          }
        }
      }
    }

    // Remove duplicates
    permissionIds = Array.from(new Set(permissionIds.map(id => id.toString())))
      .map(id => new mongoose.Types.ObjectId(id));

    const existing = await Role.findOne({ code: roleSeed.code });
    if (existing) {
      // Update existing role
      existing.permissions = permissionIds;
      existing.name = roleSeed.name;
      existing.description = roleSeed.description;
      await existing.save();
      logger.info(`  🔄 Updated role: ${roleSeed.code} (${permissionIds.length} permissions)`);
    } else {
      // Create new role (note: tenantId will need to be set per tenant)
      logger.info(`  ⚠️  Role ${roleSeed.code} requires tenantId - will be created per tenant`);
    }
  }

  logger.info('✅ Roles template prepared');
}

/**
 * Main migration function
 */
async function runMigration() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi_master';

  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('🚀 Starting RBAC Initial Migration...');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`URI: ${uri}`);
  logger.info('');

  const connection = await mongoose.createConnection(uri, {
    directConnection: true,
  });

  try {
    logger.info('✅ Connected to master database');
    logger.info('');

    // Create models (this creates collections)
    const Role = connection.model('Role', RoleSchema);
    const Permission = connection.model('Permission', PermissionSchema);
    const RoleAssignment = connection.model('RoleAssignment', RoleAssignmentSchema);

    // Create indexes
    logger.info('Creating indexes...');
    await Role.createIndexes();
    await Permission.createIndexes();
    await RoleAssignment.createIndexes();
    logger.info('✅ Indexes created');
    logger.info('');

    // Seed permissions (global, not tenant-specific)
    const permissionMap = await seedPermissions(connection);
    logger.info('');

    // Seed role templates (roles will be created per tenant)
    await seedRoles(connection, permissionMap);
    logger.info('');

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('✅ RBAC MIGRATION COMPLETE!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Next steps:');
    logger.info('  1. Roles will be created per tenant when needed');
    logger.info('  2. Use Permission and Role services to assign roles');
    logger.info('  3. Update auth middleware to use new RBAC system');
    logger.info('');

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration };

