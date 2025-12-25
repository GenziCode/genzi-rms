/**
 * Permission Configuration
 * Centralized permission definitions and mappings
 * Updated: 2025-11-23
 * Version: 2.0 (Enterprise)
 */

export interface PermissionDefinition {
  code: string;
  name: string;
  module: string;
  action: string;
  description: string;
  category: 'crud' | 'action' | 'report' | 'admin' | 'system' | 'finance';
}

/**
 * Module-Action Permission Mapping
 * Defines all available permissions organized by module
 */
export const PERMISSION_MATRIX: Record<string, PermissionDefinition[]> = {
  // --- CORE PRODUCT MANAGEMENT ---
  product: [
    { code: 'product:create', name: 'Create Product', module: 'product', action: 'create', description: 'Create new products', category: 'crud' },
    { code: 'product:read', name: 'Read Product', module: 'product', action: 'read', description: 'View products', category: 'crud' },
    { code: 'product:update', name: 'Update Product', module: 'product', action: 'update', description: 'Update products', category: 'crud' },
    { code: 'product:delete', name: 'Delete Product', module: 'product', action: 'delete', description: 'Delete products', category: 'crud' },
    { code: 'product:import', name: 'Import Products', module: 'product', action: 'import', description: 'Bulk import products', category: 'action' },
    { code: 'product:export', name: 'Export Products', module: 'product', action: 'export', description: 'Export product data', category: 'action' },
    { code: 'product:adjust_price', name: 'Adjust Price', module: 'product', action: 'adjust_price', description: 'Change product prices', category: 'action' },
    { code: 'product:manage_variants', name: 'Manage Variants', module: 'product', action: 'manage_variants', description: 'Manage product variants', category: 'crud' },
  ],

  // --- INVENTORY MANAGEMENT ---
  inventory: [
    { code: 'inventory:read', name: 'Read Inventory', module: 'inventory', action: 'read', description: 'View inventory levels', category: 'crud' },
    { code: 'inventory:update', name: 'Update Inventory', module: 'inventory', action: 'update', description: 'Update inventory counts', category: 'crud' },
    { code: 'inventory:transfer', name: 'Transfer Stock', module: 'inventory', action: 'transfer', description: 'Transfer stock between locations', category: 'action' },
    { code: 'inventory:adjust', name: 'Adjust Stock', module: 'inventory', action: 'adjust', description: 'Manual stock adjustments', category: 'action' },
    { code: 'inventory:stock_take', name: 'Stock Take', module: 'inventory', action: 'stock_take', description: 'Perform stock taking', category: 'action' },
    { code: 'inventory:write_off', name: 'Write Off', module: 'inventory', action: 'write_off', description: 'Write off damaged stock', category: 'action' },
    { code: 'inventory:low_stock_alert', name: 'Manage Alerts', module: 'inventory', action: 'low_stock_alert', description: 'Manage low stock alerts', category: 'admin' },
    { code: 'inventory:receive', name: 'Receive Stock', module: 'inventory', action: 'receive', description: 'Receive incoming stock', category: 'action' },
  ],

  // --- POINT OF SALE (POS) ---
  pos: [
    { code: 'pos:access', name: 'Access POS', module: 'pos', action: 'access', description: 'Open POS interface', category: 'action' },
    { code: 'pos:sale', name: 'Process Sale', module: 'pos', action: 'sale', description: 'Process sales transactions', category: 'action' },
    { code: 'pos:refund', name: 'Process Refund', module: 'pos', action: 'refund', description: 'Process refunds', category: 'action' },
    { code: 'pos:void', name: 'Void Transaction', module: 'pos', action: 'void', description: 'Void transactions', category: 'action' },
    { code: 'pos:discount', name: 'Apply Discount', module: 'pos', action: 'discount', description: 'Apply manual discounts', category: 'action' },
    { code: 'pos:override_price', name: 'Override Price', module: 'pos', action: 'override_price', description: 'Override product prices', category: 'admin' },
    { code: 'pos:open_register', name: 'Open Register', module: 'pos', action: 'open_register', description: 'Open cash register', category: 'action' },
    { code: 'pos:close_register', name: 'Close Register', module: 'pos', action: 'close_register', description: 'Close cash register', category: 'action' },
    { code: 'pos:view_history', name: 'View History', module: 'pos', action: 'view_history', description: 'View transaction history', category: 'crud' },
    { code: 'pos:reprint_receipt', name: 'Reprint Receipt', module: 'pos', action: 'reprint_receipt', description: 'Reprint receipts', category: 'action' },
  ],

  // --- CUSTOMER RELATIONSHIP (CRM) ---
  customer: [
    { code: 'customer:create', name: 'Create Customer', module: 'customer', action: 'create', description: 'Create new customers', category: 'crud' },
    { code: 'customer:read', name: 'Read Customer', module: 'customer', action: 'read', description: 'View customer details', category: 'crud' },
    { code: 'customer:update', name: 'Update Customer', module: 'customer', action: 'update', description: 'Update customer details', category: 'crud' },
    { code: 'customer:delete', name: 'Delete Customer', module: 'customer', action: 'delete', description: 'Delete customers', category: 'crud' },
    { code: 'customer:loyalty', name: 'Manage Loyalty', module: 'customer', action: 'loyalty', description: 'Manage loyalty points', category: 'action' },
    { code: 'customer:credit', name: 'Manage Credit', module: 'customer', action: 'credit', description: 'Manage store credit', category: 'finance' },
    { code: 'customer:group', name: 'Manage Groups', module: 'customer', action: 'group', description: 'Manage customer groups', category: 'crud' },
  ],

  // --- VENDOR MANAGEMENT ---
  vendor: [
    { code: 'vendor:create', name: 'Create Vendor', module: 'vendor', action: 'create', description: 'Create new vendors', category: 'crud' },
    { code: 'vendor:read', name: 'Read Vendor', module: 'vendor', action: 'read', description: 'View vendors', category: 'crud' },
    { code: 'vendor:update', name: 'Update Vendor', module: 'vendor', action: 'update', description: 'Update vendors', category: 'crud' },
    { code: 'vendor:delete', name: 'Delete Vendor', module: 'vendor', action: 'delete', description: 'Delete vendors', category: 'crud' },
  ],

  // --- PURCHASE ORDERS ---
  purchaseOrder: [
    { code: 'purchaseOrder:create', name: 'Create PO', module: 'purchaseOrder', action: 'create', description: 'Create purchase orders', category: 'crud' },
    { code: 'purchaseOrder:read', name: 'Read PO', module: 'purchaseOrder', action: 'read', description: 'View purchase orders', category: 'crud' },
    { code: 'purchaseOrder:update', name: 'Update PO', module: 'purchaseOrder', action: 'update', description: 'Update purchase orders', category: 'crud' },
    { code: 'purchaseOrder:delete', name: 'Delete PO', module: 'purchaseOrder', action: 'delete', description: 'Delete purchase orders', category: 'crud' },
    { code: 'purchaseOrder:approve', name: 'Approve PO', module: 'purchaseOrder', action: 'approve', description: 'Approve purchase orders', category: 'action' },
    { code: 'purchaseOrder:send', name: 'Send PO', module: 'purchaseOrder', action: 'send', description: 'Send PO to vendor', category: 'action' },
  ],

  // --- SALES & INVOICING ---
  invoice: [
    { code: 'invoice:create', name: 'Create Invoice', module: 'invoice', action: 'create', description: 'Create invoices', category: 'crud' },
    { code: 'invoice:read', name: 'Read Invoice', module: 'invoice', action: 'read', description: 'View invoices', category: 'crud' },
    { code: 'invoice:update', name: 'Update Invoice', module: 'invoice', action: 'update', description: 'Update invoices', category: 'crud' },
    { code: 'invoice:delete', name: 'Delete Invoice', module: 'invoice', action: 'delete', description: 'Delete invoices', category: 'crud' },
    { code: 'invoice:print', name: 'Print Invoice', module: 'invoice', action: 'print', description: 'Print invoices', category: 'action' },
    { code: 'invoice:void', name: 'Void Invoice', module: 'invoice', action: 'void', description: 'Void invoices', category: 'action' },
  ],

  // --- PAYMENTS & FINANCE ---
  payment: [
    { code: 'payment:create', name: 'Record Payment', module: 'payment', action: 'create', description: 'Record payments', category: 'finance' },
    { code: 'payment:read', name: 'Read Payment', module: 'payment', action: 'read', description: 'View payments', category: 'finance' },
    { code: 'payment:update', name: 'Update Payment', module: 'payment', action: 'update', description: 'Update payments', category: 'finance' },
    { code: 'payment:delete', name: 'Delete Payment', module: 'payment', action: 'delete', description: 'Delete payments', category: 'finance' },
    { code: 'payment:refund', name: 'Process Refund', module: 'payment', action: 'refund', description: 'Process payment refunds', category: 'finance' },
  ],

  // --- STORE MANAGEMENT ---
  store: [
    { code: 'store:create', name: 'Create Store', module: 'store', action: 'create', description: 'Create stores', category: 'admin' },
    { code: 'store:read', name: 'Read Store', module: 'store', action: 'read', description: 'View stores', category: 'crud' },
    { code: 'store:update', name: 'Update Store', module: 'store', action: 'update', description: 'Update stores', category: 'admin' },
    { code: 'store:delete', name: 'Delete Store', module: 'store', action: 'delete', description: 'Delete stores', category: 'admin' },
    { code: 'store:settings', name: 'Store Settings', module: 'store', action: 'settings', description: 'Manage store settings', category: 'admin' },
  ],

  // --- USER & HR MANAGEMENT ---
  user: [
    { code: 'user:create', name: 'Create User', module: 'user', action: 'create', description: 'Create users', category: 'admin' },
    { code: 'user:read', name: 'Read User', module: 'user', action: 'read', description: 'View users', category: 'admin' },
    { code: 'user:update', name: 'Update User', module: 'user', action: 'update', description: 'Update users', category: 'admin' },
    { code: 'user:delete', name: 'Delete User', module: 'user', action: 'delete', description: 'Delete users', category: 'admin' },
    { code: 'user:reset_password', name: 'Reset Password', module: 'user', action: 'reset_password', description: 'Reset user passwords', category: 'admin' },
    { code: 'user:manage_schedule', name: 'Manage Schedule', module: 'user', action: 'manage_schedule', description: 'Manage employee schedules', category: 'admin' },
  ],

  // --- ROLE & PERMISSION MANAGEMENT ---
  role: [
    { code: 'role:create', name: 'Create Role', module: 'role', action: 'create', description: 'Create roles', category: 'admin' },
    { code: 'role:read', name: 'Read Role', module: 'role', action: 'read', description: 'View roles', category: 'admin' },
    { code: 'role:update', name: 'Update Role', module: 'role', action: 'update', description: 'Update roles', category: 'admin' },
    { code: 'role:delete', name: 'Delete Role', module: 'role', action: 'delete', description: 'Delete roles', category: 'admin' },
    { code: 'role:assign', name: 'Assign Role', module: 'role', action: 'assign', description: 'Assign roles to users', category: 'admin' },
  ],

  // --- REPORTING & ANALYTICS ---
  report: [
    { code: 'report:sales', name: 'Sales Reports', module: 'report', action: 'sales', description: 'View sales reports', category: 'report' },
    { code: 'report:inventory', name: 'Inventory Reports', module: 'report', action: 'inventory', description: 'View inventory reports', category: 'report' },
    { code: 'report:financial', name: 'Financial Reports', module: 'report', action: 'financial', description: 'View financial reports', category: 'report' },
    { code: 'report:employee', name: 'Employee Reports', module: 'report', action: 'employee', description: 'View employee performance', category: 'report' },
    { code: 'report:tax', name: 'Tax Reports', module: 'report', action: 'tax', description: 'View tax reports', category: 'report' },
    { code: 'report:audit', name: 'Audit Logs', module: 'report', action: 'audit', description: 'View system audit logs', category: 'report' },
    { code: 'report:custom', name: 'Custom Reports', module: 'report', action: 'custom', description: 'Create custom reports', category: 'report' },
    { code: 'report:export', name: 'Export Reports', module: 'report', action: 'export', description: 'Export reports', category: 'report' },
  ],

  // --- SYSTEM SETTINGS ---
  settings: [
    { code: 'settings:read', name: 'Read Settings', module: 'settings', action: 'read', description: 'View system settings', category: 'admin' },
    { code: 'settings:update', name: 'Update Settings', module: 'settings', action: 'update', description: 'Update system settings', category: 'admin' },
    { code: 'settings:backup', name: 'Manage Backups', module: 'settings', action: 'backup', description: 'Manage system backups', category: 'system' },
    { code: 'settings:integrations', name: 'Manage Integrations', module: 'settings', action: 'integrations', description: 'Manage third-party integrations', category: 'system' },
    { code: 'settings:logs', name: 'View System Logs', module: 'settings', action: 'logs', description: 'View technical logs', category: 'system' },
  ],

  // --- TENANT MANAGEMENT ---
  tenant: [
    { code: 'tenant:read', name: 'Read Tenant', module: 'tenant', action: 'read', description: 'View tenant info', category: 'admin' },
    { code: 'tenant:update', name: 'Update Tenant', module: 'tenant', action: 'update', description: 'Update tenant info', category: 'admin' },
    { code: 'tenant:billing', name: 'Manage Billing', module: 'tenant', action: 'billing', description: 'Manage subscription and billing', category: 'admin' },
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
