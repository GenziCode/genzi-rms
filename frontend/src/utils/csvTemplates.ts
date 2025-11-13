/**
 * CSV Template Generator
 * Generates CSV templates for bulk uploads across different modules
 */

export interface CSVTemplateConfig {
  module: string;
  headers: string[];
  sampleRows: string[][];
  description?: string;
  instructions?: string[];
}

/**
 * Generate CSV content from template config
 */
export function generateCSVTemplate(config: CSVTemplateConfig): string {
  const lines: string[] = [];
  
  // Add description and instructions as comments (if any)
  if (config.description) {
    lines.push(`# ${config.description}`);
  }
  if (config.instructions && config.instructions.length > 0) {
    config.instructions.forEach(instruction => {
      lines.push(`# ${instruction}`);
    });
    lines.push(''); // Empty line before headers
  }
  
  // Add headers
  lines.push(config.headers.join(','));
  
  // Add sample rows
  config.sampleRows.forEach(row => {
    lines.push(row.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Download CSV template as file
 */
export function downloadCSVTemplate(config: CSVTemplateConfig, filename?: string): void {
  const csvContent = generateCSVTemplate(config);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `${config.module}_template.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file content
 */
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  return lines.map(line => {
    // Simple CSV parser (handles quoted values)
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  });
}

/**
 * CSV Templates for different modules
 */
export const csvTemplates = {
  /**
   * Purchase Order Products Template
   */
  purchaseOrderProducts: {
    module: 'purchase_order_products',
    headers: ['SKU/Barcode', 'Quantity', 'Unit Price (Optional)'],
    sampleRows: [
      ['ELEC-1001', '10', '159.99'],
      ['GROC-2003', '5', ''],
      ['8901234567890', '20', '45.50'],
    ],
    description: 'Purchase Order Products Bulk Upload Template',
    instructions: [
      'Format: SKU/Barcode, Quantity, Unit Price (Optional)',
      'One product per line',
      'Unit Price is optional - if not provided, product cost/price will be used',
      'You can use either SKU or Barcode to identify products',
    ],
  },

  /**
   * Products Template
   */
  products: {
    module: 'products',
    headers: [
      'Name',
      'SKU',
      'Barcode',
      'Category',
      'Price',
      'Cost',
      'Stock',
      'Unit',
      'Tax Rate (%)',
      'Description',
    ],
    sampleRows: [
      [
        'Sample Product',
        'PROD-001',
        '1234567890123',
        'Electronics',
        '99.99',
        '50.00',
        '100',
        'pcs',
        '10',
        'Sample product description',
      ],
    ],
    description: 'Products Bulk Upload Template',
    instructions: [
      'All fields except Description are required',
      'Category must match an existing category name',
      'Price, Cost, Stock, and Tax Rate should be numeric values',
    ],
  },

  /**
   * Customers Template
   */
  customers: {
    module: 'customers',
    headers: ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip Code', 'Country'],
    sampleRows: [
      ['John Doe', 'john@example.com', '+1234567890', '123 Main St', 'New York', 'NY', '10001', 'USA'],
    ],
    description: 'Customers Bulk Upload Template',
    instructions: [
      'Name, Email, and Phone are required',
      'Address fields are optional',
    ],
  },

  /**
   * Vendors Template
   */
  vendors: {
    module: 'vendors',
    headers: [
      'Name',
      'Company',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Tax ID',
      'Payment Terms',
    ],
    sampleRows: [
      [
        'John Supplier',
        'ABC Supplies Inc',
        'supplier@example.com',
        '+1234567890',
        '456 Business Ave',
        'Los Angeles',
        'CA',
        '90001',
        'USA',
        'TAX123456',
        'Net 30',
      ],
    ],
    description: 'Vendors Bulk Upload Template',
    instructions: [
      'Name and Company are required',
      'Other fields are optional',
    ],
  },
};

/**
 * Get template config by module name
 */
export function getTemplate(module: keyof typeof csvTemplates): CSVTemplateConfig {
  return csvTemplates[module];
}

