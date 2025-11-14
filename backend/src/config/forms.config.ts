/**
 * Forms Configuration
 * Based on Candela SecurityForms.xml (299+ forms)
 * 
 * Created: 2025-01-13 17:00:00 UTC
 * Last Updated: 2025-01-13 17:00:00 UTC
 * 
 * Note: This is a sample configuration. Full forms list will be populated
 * by running the parse-candela-forms script or manual mapping.
 */

export interface FormDefinition {
  formName: string;
  formCaption: string;
  formCategory: string;
  module?: string;
  route?: string;
  httpMethods?: string[];
  isActive?: boolean;
}

/**
 * Route to Form Name Mapping
 * Maps API routes to form names for permission checking
 */
export const ROUTE_TO_FORM_MAP: Record<string, string> = {
  // Product routes
  'GET /api/products': 'frmProductFields',
  'POST /api/products': 'frmProductFields',
  'PUT /api/products/:id': 'frmProductFields',
  'DELETE /api/products/:id': 'frmProductFields',
  'GET /api/categories': 'frmDefCategory',
  'POST /api/categories': 'frmDefCategory',
  'PUT /api/categories/:id': 'frmDefCategory',
  'DELETE /api/categories/:id': 'frmDefCategory',
  
  // Customer routes
  'GET /api/customers': 'frmMembershipInfo',
  'POST /api/customers': 'frmMembershipInfo',
  'PUT /api/customers/:id': 'frmMembershipInfo',
  'DELETE /api/customers/:id': 'frmMembershipInfo',
  
  // Vendor routes
  'GET /api/vendors': 'frmDefSuppliers',
  'POST /api/vendors': 'frmDefSuppliers',
  'PUT /api/vendors/:id': 'frmDefSuppliers',
  'DELETE /api/vendors/:id': 'frmDefSuppliers',
  
  // Purchase Order routes
  'GET /api/purchase-orders': 'frmPurchaseOrder',
  'POST /api/purchase-orders': 'frmPurchaseOrder',
  'PUT /api/purchase-orders/:id': 'frmPurchaseOrder',
  'DELETE /api/purchase-orders/:id': 'frmPurchaseOrder',
  
  // Store routes
  'GET /api/stores': 'frmDefShops',
  'POST /api/stores': 'frmDefShops',
  'PUT /api/stores/:id': 'frmDefShops',
  'DELETE /api/stores/:id': 'frmDefShops',
  
  // POS routes
  'GET /api/pos': 'frmSalesAndReturns',
  'POST /api/pos': 'frmSalesAndReturns',
  'GET /api/pos/sales': 'frmSalesAndReturns',
  'POST /api/pos/sales': 'frmSalesAndReturns',
  
  // Invoice routes
  'GET /api/invoices': 'frmInvoiceReports',
  'POST /api/invoices': 'frmSalesAndReturns',
  'PUT /api/invoices/:id': 'frmSalesAndReturns',
  'DELETE /api/invoices/:id': 'frmSalesAndReturns',
  
  // Inventory routes
  'GET /api/inventory': 'frmShopInventory',
  'PUT /api/inventory/:id': 'frmShopInventory',
  'GET /api/inventory/audit': 'frmPhysicalAudit',
  'POST /api/inventory/audit': 'frmPhysicalAudit',
  'GET /api/inventory/transfer': 'frmDSTShop',
  'POST /api/inventory/transfer': 'frmDSTShop',
  
  // User routes
  'GET /api/users': 'frmDefShopEmployees',
  'POST /api/users': 'frmDefShopEmployees',
  'PUT /api/users/:id': 'frmDefShopEmployees',
  'DELETE /api/users/:id': 'frmDefShopEmployees',
  
  // Settings routes
  'GET /api/settings': 'frmSystemConfig',
  'PUT /api/settings': 'frmSystemConfig',
};

/**
 * Sample Forms Configuration
 * Full list will be populated from XML parsing or manual entry
 */
export const FORMS_CONFIG: FormDefinition[] = [
  // Product Forms
  {
    formName: 'frmProductFields',
    formCaption: 'Products',
    formCategory: 'Configuration',
    module: 'product',
    route: '/api/products',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  {
    formName: 'frmDefCategory',
    formCaption: 'Categories',
    formCategory: 'Configuration > Misc',
    module: 'category',
    route: '/api/categories',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // Customer Forms
  {
    formName: 'frmMembershipInfo',
    formCaption: 'Customer Information',
    formCategory: 'Shop Activities',
    module: 'customer',
    route: '/api/customers',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // Vendor Forms
  {
    formName: 'frmDefSuppliers',
    formCaption: 'Suppliers',
    formCategory: 'Configuration > Misc',
    module: 'vendor',
    route: '/api/vendors',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // Purchase Order Forms
  {
    formName: 'frmPurchaseOrder',
    formCaption: 'Supplier Purchase Order',
    formCategory: 'Suppliers Activities',
    module: 'purchaseOrder',
    route: '/api/purchase-orders',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // Store Forms
  {
    formName: 'frmDefShops',
    formCaption: 'Shop Definition',
    formCategory: 'Configuration',
    module: 'store',
    route: '/api/stores',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // POS Forms
  {
    formName: 'frmSalesAndReturns',
    formCaption: 'Sales/Return',
    formCategory: 'Shop Activities',
    module: 'pos',
    route: '/api/pos',
    httpMethods: ['GET', 'POST'],
    isActive: true,
  },
  
  // Inventory Forms
  {
    formName: 'frmShopInventory',
    formCaption: 'D-07 Shop Inventory Report',
    formCategory: 'Reports > Stock Reports',
    module: 'inventory',
    route: '/api/inventory',
    httpMethods: ['GET'],
    isActive: true,
  },
  {
    formName: 'frmPhysicalAudit',
    formCaption: 'Physical Audit',
    formCategory: 'Shop Activities',
    module: 'inventory',
    route: '/api/inventory/audit',
    httpMethods: ['GET', 'POST'],
    isActive: true,
  },
  
  // User Forms
  {
    formName: 'frmDefShopEmployees',
    formCaption: 'Shop Employees',
    formCategory: 'Configuration',
    module: 'user',
    route: '/api/users',
    httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    isActive: true,
  },
  
  // Settings Forms
  {
    formName: 'frmSystemConfig',
    formCaption: 'System Configuration',
    formCategory: 'Configuration',
    module: 'settings',
    route: '/api/settings',
    httpMethods: ['GET', 'PUT'],
    isActive: true,
  },
];

/**
 * Get form by route and method
 */
export function getFormByRoute(
  route: string,
  method: string
): FormDefinition | undefined {
  const key = `${method.toUpperCase()} ${route}`;
  const formName = ROUTE_TO_FORM_MAP[key];
  
  if (formName) {
    return FORMS_CONFIG.find(f => f.formName === formName);
  }
  
  // Try pattern matching for dynamic routes
  for (const [pattern, formName] of Object.entries(ROUTE_TO_FORM_MAP)) {
    const [patternMethod, patternRoute] = pattern.split(' ', 2);
    if (patternMethod === method.toUpperCase()) {
      // Simple pattern matching (can be enhanced)
      const patternRegex = new RegExp(
        '^' + patternRoute.replace(/:[^/]+/g, '[^/]+') + '$'
      );
      if (patternRegex.test(route)) {
        return FORMS_CONFIG.find(f => f.formName === formName);
      }
    }
  }
  
  return undefined;
}

/**
 * Get forms by category
 */
export function getFormsByCategory(category: string): FormDefinition[] {
  return FORMS_CONFIG.filter(form => form.formCategory === category);
}

/**
 * Get forms by module
 */
export function getFormsByModule(module: string): FormDefinition[] {
  return FORMS_CONFIG.filter(form => form.module === module);
}

/**
 * Get form by name
 */
export function getFormByName(formName: string): FormDefinition | undefined {
  return FORMS_CONFIG.find(form => form.formName === formName);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  FORMS_CONFIG.forEach(form => {
    categories.add(form.formCategory);
  });
  return Array.from(categories).sort();
}

/**
 * Get all modules
 */
export function getAllModules(): string[] {
  const modules = new Set<string>();
  FORMS_CONFIG.forEach(form => {
    if (form.module) {
      modules.add(form.module);
    }
  });
  return Array.from(modules).sort();
}

