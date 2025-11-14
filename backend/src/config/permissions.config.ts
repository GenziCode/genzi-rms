/**
 * Permission Configuration
 * Centralized permission definitions and mappings
 */

export interface PermissionDefinition {
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
  category: 'crud' | 'action' | 'report' | 'admin';
}

/**
 * Module-Action Permission Mapping
 * Defines all available permissions organized by module
 */
export const PERMISSION_MATRIX: Record<string, PermissionDefinition[]> = {
  product: [
    {
      code: 'product:create',
      name: 'Create Product',
      module: 'product',
      action: 'create',
      description: 'Create new products',
      category: 'crud',
    },
    {
      code: 'product:read',
      name: 'Read Product',
      module: 'product',
      action: 'read',
      description: 'View products',
      category: 'crud',
    },
    {
      code: 'product:update',
      name: 'Update Product',
      module: 'product',
      action: 'update',
      description: 'Update products',
      category: 'crud',
    },
    {
      code: 'product:delete',
      name: 'Delete Product',
      module: 'product',
      action: 'delete',
      description: 'Delete products',
      category: 'crud',
    },
  ],
  customer: [
    {
      code: 'customer:create',
      name: 'Create Customer',
      module: 'customer',
      action: 'create',
      description: 'Create new customers',
      category: 'crud',
    },
    {
      code: 'customer:read',
      name: 'Read Customer',
      module: 'customer',
      action: 'read',
      description: 'View customers',
      category: 'crud',
    },
    {
      code: 'customer:update',
      name: 'Update Customer',
      module: 'customer',
      action: 'update',
      description: 'Update customers',
      category: 'crud',
    },
    {
      code: 'customer:delete',
      name: 'Delete Customer',
      module: 'customer',
      action: 'delete',
      description: 'Delete customers',
      category: 'crud',
    },
  ],
  vendor: [
    {
      code: 'vendor:create',
      name: 'Create Vendor',
      module: 'vendor',
      action: 'create',
      description: 'Create new vendors',
      category: 'crud',
    },
    {
      code: 'vendor:read',
      name: 'Read Vendor',
      module: 'vendor',
      action: 'read',
      description: 'View vendors',
      category: 'crud',
    },
    {
      code: 'vendor:update',
      name: 'Update Vendor',
      module: 'vendor',
      action: 'update',
      description: 'Update vendors',
      category: 'crud',
    },
    {
      code: 'vendor:delete',
      name: 'Delete Vendor',
      module: 'vendor',
      action: 'delete',
      description: 'Delete vendors',
      category: 'crud',
    },
  ],
  purchaseOrder: [
    {
      code: 'purchaseOrder:create',
      name: 'Create Purchase Order',
      module: 'purchaseOrder',
      action: 'create',
      description: 'Create purchase orders',
      category: 'crud',
    },
    {
      code: 'purchaseOrder:read',
      name: 'Read Purchase Order',
      module: 'purchaseOrder',
      action: 'read',
      description: 'View purchase orders',
      category: 'crud',
    },
    {
      code: 'purchaseOrder:update',
      name: 'Update Purchase Order',
      module: 'purchaseOrder',
      action: 'update',
      description: 'Update purchase orders',
      category: 'crud',
    },
    {
      code: 'purchaseOrder:delete',
      name: 'Delete Purchase Order',
      module: 'purchaseOrder',
      action: 'delete',
      description: 'Delete purchase orders',
      category: 'crud',
    },
    {
      code: 'purchaseOrder:approve',
      name: 'Approve Purchase Order',
      module: 'purchaseOrder',
      action: 'approve',
      description: 'Approve purchase orders',
      category: 'action',
    },
  ],
  inventory: [
    {
      code: 'inventory:read',
      name: 'Read Inventory',
      module: 'inventory',
      action: 'read',
      description: 'View inventory',
      category: 'crud',
    },
    {
      code: 'inventory:update',
      name: 'Update Inventory',
      module: 'inventory',
      action: 'update',
      description: 'Update inventory levels',
      category: 'crud',
    },
    {
      code: 'inventory:transfer',
      name: 'Transfer Inventory',
      module: 'inventory',
      action: 'transfer',
      description: 'Transfer inventory between stores',
      category: 'action',
    },
    {
      code: 'inventory:adjust',
      name: 'Adjust Inventory',
      module: 'inventory',
      action: 'adjust',
      description: 'Adjust inventory counts',
      category: 'action',
    },
  ],
  pos: [
    {
      code: 'pos:sale',
      name: 'Process Sale',
      module: 'pos',
      action: 'sale',
      description: 'Process sales transactions',
      category: 'action',
    },
    {
      code: 'pos:refund',
      name: 'Process Refund',
      module: 'pos',
      action: 'refund',
      description: 'Process refunds',
      category: 'action',
    },
    {
      code: 'pos:void',
      name: 'Void Transaction',
      module: 'pos',
      action: 'void',
      description: 'Void transactions',
      category: 'action',
    },
    {
      code: 'pos:read',
      name: 'Read POS',
      module: 'pos',
      action: 'read',
      description: 'View POS transactions',
      category: 'crud',
    },
  ],
  invoice: [
    {
      code: 'invoice:create',
      name: 'Create Invoice',
      module: 'invoice',
      action: 'create',
      description: 'Create invoices',
      category: 'crud',
    },
    {
      code: 'invoice:read',
      name: 'Read Invoice',
      module: 'invoice',
      action: 'read',
      description: 'View invoices',
      category: 'crud',
    },
    {
      code: 'invoice:update',
      name: 'Update Invoice',
      module: 'invoice',
      action: 'update',
      description: 'Update invoices',
      category: 'crud',
    },
    {
      code: 'invoice:delete',
      name: 'Delete Invoice',
      module: 'invoice',
      action: 'delete',
      description: 'Delete invoices',
      category: 'crud',
    },
    {
      code: 'invoice:print',
      name: 'Print Invoice',
      module: 'invoice',
      action: 'print',
      description: 'Print invoices',
      category: 'action',
    },
  ],
  payment: [
    {
      code: 'payment:create',
      name: 'Create Payment',
      module: 'payment',
      action: 'create',
      description: 'Record payments',
      category: 'crud',
    },
    {
      code: 'payment:read',
      name: 'Read Payment',
      module: 'payment',
      action: 'read',
      description: 'View payments',
      category: 'crud',
    },
    {
      code: 'payment:update',
      name: 'Update Payment',
      module: 'payment',
      action: 'update',
      description: 'Update payments',
      category: 'crud',
    },
    {
      code: 'payment:delete',
      name: 'Delete Payment',
      module: 'payment',
      action: 'delete',
      description: 'Delete payments',
      category: 'crud',
    },
  ],
  store: [
    {
      code: 'store:create',
      name: 'Create Store',
      module: 'store',
      action: 'create',
      description: 'Create stores',
      category: 'crud',
    },
    {
      code: 'store:read',
      name: 'Read Store',
      module: 'store',
      action: 'read',
      description: 'View stores',
      category: 'crud',
    },
    {
      code: 'store:update',
      name: 'Update Store',
      module: 'store',
      action: 'update',
      description: 'Update stores',
      category: 'crud',
    },
    {
      code: 'store:delete',
      name: 'Delete Store',
      module: 'store',
      action: 'delete',
      description: 'Delete stores',
      category: 'crud',
    },
  ],
  category: [
    {
      code: 'category:create',
      name: 'Create Category',
      module: 'category',
      action: 'create',
      description: 'Create categories',
      category: 'crud',
    },
    {
      code: 'category:read',
      name: 'Read Category',
      module: 'category',
      action: 'read',
      description: 'View categories',
      category: 'crud',
    },
    {
      code: 'category:update',
      name: 'Update Category',
      module: 'category',
      action: 'update',
      description: 'Update categories',
      category: 'crud',
    },
    {
      code: 'category:delete',
      name: 'Delete Category',
      module: 'category',
      action: 'delete',
      description: 'Delete categories',
      category: 'crud',
    },
  ],
  user: [
    {
      code: 'user:create',
      name: 'Create User',
      module: 'user',
      action: 'create',
      description: 'Create users',
      category: 'crud',
    },
    {
      code: 'user:read',
      name: 'Read User',
      module: 'user',
      action: 'read',
      description: 'View users',
      category: 'crud',
    },
    {
      code: 'user:update',
      name: 'Update User',
      module: 'user',
      action: 'update',
      description: 'Update users',
      category: 'crud',
    },
    {
      code: 'user:delete',
      name: 'Delete User',
      module: 'user',
      action: 'delete',
      description: 'Delete users',
      category: 'crud',
    },
  ],
  role: [
    {
      code: 'role:create',
      name: 'Create Role',
      module: 'role',
      action: 'create',
      description: 'Create roles',
      category: 'admin',
    },
    {
      code: 'role:read',
      name: 'Read Role',
      module: 'role',
      action: 'read',
      description: 'View roles',
      category: 'admin',
    },
    {
      code: 'role:update',
      name: 'Update Role',
      module: 'role',
      action: 'update',
      description: 'Update roles',
      category: 'admin',
    },
    {
      code: 'role:delete',
      name: 'Delete Role',
      module: 'role',
      action: 'delete',
      description: 'Delete roles',
      category: 'admin',
    },
  ],
  tenant: [
    {
      code: 'tenant:read',
      name: 'Read Tenant',
      module: 'tenant',
      action: 'read',
      description: 'View tenant settings',
      category: 'admin',
    },
    {
      code: 'tenant:update',
      name: 'Update Tenant',
      module: 'tenant',
      action: 'update',
      description: 'Update tenant settings',
      category: 'admin',
    },
  ],
  report: [
    {
      code: 'report:sales',
      name: 'Sales Reports',
      module: 'report',
      action: 'sales',
      description: 'View sales reports',
      category: 'report',
    },
    {
      code: 'report:inventory',
      name: 'Inventory Reports',
      module: 'report',
      action: 'inventory',
      description: 'View inventory reports',
      category: 'report',
    },
    {
      code: 'report:financial',
      name: 'Financial Reports',
      module: 'report',
      action: 'financial',
      description: 'View financial reports',
      category: 'report',
    },
    {
      code: 'report:custom',
      name: 'Custom Reports',
      module: 'report',
      action: 'custom',
      description: 'Create custom reports',
      category: 'report',
    },
  ],
  settings: [
    {
      code: 'settings:read',
      name: 'Read Settings',
      module: 'settings',
      action: 'read',
      description: 'View settings',
      category: 'admin',
    },
    {
      code: 'settings:update',
      name: 'Update Settings',
      module: 'settings',
      action: 'update',
      description: 'Update settings',
      category: 'admin',
    },
  ],
};

/**
 * Get all permission definitions
 */
export function getAllPermissionDefinitions(): PermissionDefinition[] {
  return Object.values(PERMISSION_MATRIX).flat();
}

/**
 * Get permissions by module
 */
export function getPermissionsByModule(module: string): PermissionDefinition[] {
  return PERMISSION_MATRIX[module.toLowerCase()] || [];
}

/**
 * Get all modules
 */
export function getAllModules(): string[] {
  return Object.keys(PERMISSION_MATRIX);
}

