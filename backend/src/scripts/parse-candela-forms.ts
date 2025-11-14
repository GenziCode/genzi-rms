import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

/**
 * Parse Candela SecurityForms.xml and generate forms configuration
 * This script reads the XML file and creates a TypeScript config file
 */

interface FormData {
  formName: string;
  formCaption: string;
  formCategory: string;
  IsInUse: string;
  SortOrder?: string;
  formNameNew?: string;
}

interface RouteMapping {
  [formName: string]: {
    route?: string;
    module?: string;
    httpMethods?: string[];
  };
}

/**
 * Map form names to routes and modules
 * This mapping can be extended as routes are created
 */
const ROUTE_MAPPINGS: RouteMapping = {
  // Product forms
  frmProductFields: { route: '/api/products', module: 'product', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  frmDefCategory: { route: '/api/categories', module: 'category', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  frmDefSubCategory: { route: '/api/categories', module: 'category', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  
  // Customer forms
  frmMembershipInfo: { route: '/api/customers', module: 'customer', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  frmMemberReport: { route: '/api/customers', module: 'customer', httpMethods: ['GET'] },
  
  // Vendor/Supplier forms
  frmDefSuppliers: { route: '/api/vendors', module: 'vendor', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  frmSuppPayments: { route: '/api/vendors/payments', module: 'vendor', httpMethods: ['GET', 'POST'] },
  frmSuppPurchaseAndReturn: { route: '/api/purchase-orders', module: 'purchaseOrder', httpMethods: ['GET', 'POST', 'PUT'] },
  frmPurchaseOrder: { route: '/api/purchase-orders', module: 'purchaseOrder', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  
  // Store forms
  frmDefShops: { route: '/api/stores', module: 'store', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  
  // POS/Sales forms
  frmSalesAndReturns: { route: '/api/pos', module: 'pos', httpMethods: ['GET', 'POST'] },
  frmInvoiceReports: { route: '/api/invoices', module: 'invoice', httpMethods: ['GET'] },
  
  // Inventory forms
  frmShopInventory: { route: '/api/inventory', module: 'inventory', httpMethods: ['GET'] },
  frmPhysicalAudit: { route: '/api/inventory/audit', module: 'inventory', httpMethods: ['GET', 'POST'] },
  frmDSTShop: { route: '/api/inventory/transfer', module: 'inventory', httpMethods: ['GET', 'POST'] },
  
  // User forms
  frmDefShopEmployees: { route: '/api/users', module: 'user', httpMethods: ['GET', 'POST', 'PUT', 'DELETE'] },
  
  // Settings forms
  frmSystemConfig: { route: '/api/settings', module: 'settings', httpMethods: ['GET', 'PUT'] },
};

/**
 * Extract module from form category or name
 */
function extractModule(formName: string, formCategory: string): string | undefined {
  const name = formName.toLowerCase();
  const category = formCategory.toLowerCase();

  // Direct mappings
  if (name.includes('product') || name.includes('category') || name.includes('size') || name.includes('combination')) {
    return 'product';
  }
  if (name.includes('customer') || name.includes('member')) {
    return 'customer';
  }
  if (name.includes('supplier') || name.includes('vendor') || name.includes('supp')) {
    return 'vendor';
  }
  if (name.includes('shop') || name.includes('store')) {
    return 'store';
  }
  if (name.includes('sale') || name.includes('pos') || name.includes('invoice')) {
    if (name.includes('report')) return 'report';
    if (name.includes('invoice')) return 'invoice';
    return 'pos';
  }
  if (name.includes('inventory') || name.includes('stock') || name.includes('str') || name.includes('audit')) {
    return 'inventory';
  }
  if (name.includes('purchase') || name.includes('grn') || name.includes('po')) {
    return 'purchaseOrder';
  }
  if (name.includes('payment')) {
    return 'payment';
  }
  if (name.includes('user') || name.includes('employee')) {
    return 'user';
  }
  if (name.includes('role') || name.includes('permission')) {
    return 'role';
  }
  if (name.includes('report')) {
    return 'report';
  }
  if (name.includes('setting') || name.includes('config')) {
    return 'settings';
  }

  // Category-based mappings
  if (category.includes('configuration')) {
    return undefined; // Too broad
  }
  if (category.includes('shop activities')) {
    return 'pos';
  }
  if (category.includes('inventory')) {
    return 'inventory';
  }
  if (category.includes('purchase')) {
    return 'purchaseOrder';
  }
  if (category.includes('customer')) {
    return 'customer';
  }

  return undefined;
}

async function parseFormsXML() {
  const xmlPath = path.join(
    __dirname,
    '../../../../Can_Hb_References/CandelaObjects/SecurityForms.xml'
  );

  if (!fs.existsSync(xmlPath)) {
    console.error(`XML file not found at: ${xmlPath}`);
    console.log('Please ensure Can_Hb_References folder is accessible');
    return;
  }

  console.log('Reading XML file...');
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const result = parser.parse(xmlContent);
  const forms: FormData[] = result.SecurityForms?.forms?.form || [];

  console.log(`Found ${forms.length} forms`);

  // Generate forms configuration
  const formsConfig = forms
    .filter(form => form.IsInUse === '1') // Only active forms
    .map(form => {
      const routeMapping = ROUTE_MAPPINGS[form.formName];
      const module = routeMapping?.module || extractModule(form.formName, form.formCategory);

      return {
        formName: form.formName,
        formCaption: form.formCaption,
        formCategory: form.formCategory,
        module: module,
        route: routeMapping?.route,
        httpMethods: routeMapping?.httpMethods || ['GET', 'POST', 'PUT', 'DELETE'],
      };
    });

  // Generate TypeScript config file
  const configContent = `/**
 * Forms Configuration
 * Auto-generated from Candela SecurityForms.xml
 * 
 * Generated: ${new Date().toISOString()}
 * Total Forms: ${formsConfig.length}
 */

export interface FormDefinition {
  formName: string;
  formCaption: string;
  formCategory: string;
  module?: string;
  route?: string;
  httpMethods?: string[];
}

export const FORMS_CONFIG: FormDefinition[] = ${JSON.stringify(formsConfig, null, 2)};

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
`;

  const outputPath = path.join(__dirname, '../config/forms.config.ts');
  fs.writeFileSync(outputPath, configContent, 'utf-8');

  console.log(`✅ Generated forms config: ${outputPath}`);
  console.log(`   Total forms: ${formsConfig.length}`);
  console.log(`   Categories: ${new Set(formsConfig.map(f => f.formCategory)).size}`);
  console.log(`   Modules mapped: ${new Set(formsConfig.filter(f => f.module).map(f => f.module)).size}`);
}

// Run if called directly
if (require.main === module) {
  parseFormsXML().catch(console.error);
}

export { parseFormsXML };

