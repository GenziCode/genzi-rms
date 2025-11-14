/**
 * Form Controls Configuration
 * Based on Candela SecurityFormControls.xml (950+ controls)
 * 
 * Created: 2025-01-13 18:30:00 UTC
 * Last Updated: 2025-01-13 18:30:00 UTC
 * 
 * Note: This is a sample configuration. Full controls list will be populated
 * by parsing SecurityFormControls.xml or manual mapping.
 */

export interface FormControlDefinition {
  formName: string;
  controlName: string;
  controlType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file' | 'other';
  fieldPath?: string;
  label: string;
  isVisible: boolean;
  isEditable: boolean;
  isRequired: boolean;
  defaultValue?: any;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Sample Form Controls Configuration
 * Full list will be populated from XML parsing or manual entry
 */
export const FORM_CONTROLS_CONFIG: FormControlDefinition[] = [
  // Product Form Controls
  {
    formName: 'frmProductFields',
    controlName: 'name',
    controlType: 'text',
    fieldPath: 'name',
    label: 'Product Name',
    isVisible: true,
    isEditable: true,
    isRequired: true,
    validationRules: { minLength: 2, maxLength: 200 },
  },
  {
    formName: 'frmProductFields',
    controlName: 'sku',
    controlType: 'text',
    fieldPath: 'sku',
    label: 'SKU',
    isVisible: true,
    isEditable: true,
    isRequired: true,
  },
  {
    formName: 'frmProductFields',
    controlName: 'price',
    controlType: 'number',
    fieldPath: 'price',
    label: 'Price',
    isVisible: true,
    isEditable: true,
    isRequired: true,
    validationRules: { min: 0 },
  },
  {
    formName: 'frmProductFields',
    controlName: 'cost',
    controlType: 'number',
    fieldPath: 'cost',
    label: 'Cost',
    isVisible: true,
    isEditable: true,
    isRequired: false,
    validationRules: { min: 0 },
  },
  
  // Customer Form Controls
  {
    formName: 'frmMembershipInfo',
    controlName: 'firstName',
    controlType: 'text',
    fieldPath: 'firstName',
    label: 'First Name',
    isVisible: true,
    isEditable: true,
    isRequired: true,
  },
  {
    formName: 'frmMembershipInfo',
    controlName: 'lastName',
    controlType: 'text',
    fieldPath: 'lastName',
    label: 'Last Name',
    isVisible: true,
    isEditable: true,
    isRequired: true,
  },
  {
    formName: 'frmMembershipInfo',
    controlName: 'email',
    controlType: 'text',
    fieldPath: 'email',
    label: 'Email',
    isVisible: true,
    isEditable: true,
    isRequired: false,
    validationRules: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  },
  {
    formName: 'frmMembershipInfo',
    controlName: 'phone',
    controlType: 'text',
    fieldPath: 'phone',
    label: 'Phone',
    isVisible: true,
    isEditable: true,
    isRequired: false,
  },
  
  // Vendor Form Controls
  {
    formName: 'frmDefSuppliers',
    controlName: 'name',
    controlType: 'text',
    fieldPath: 'name',
    label: 'Vendor Name',
    isVisible: true,
    isEditable: true,
    isRequired: true,
  },
  {
    formName: 'frmDefSuppliers',
    controlName: 'company',
    controlType: 'text',
    fieldPath: 'company',
    label: 'Company',
    isVisible: true,
    isEditable: true,
    isRequired: true,
  },
  {
    formName: 'frmDefSuppliers',
    controlName: 'creditLimit',
    controlType: 'number',
    fieldPath: 'creditLimit',
    label: 'Credit Limit',
    isVisible: true,
    isEditable: true,
    isRequired: false,
    validationRules: { min: 0 },
  },
];

/**
 * Get controls by form name
 */
export function getControlsByForm(formName: string): FormControlDefinition[] {
  return FORM_CONTROLS_CONFIG.filter(control => control.formName === formName);
}

/**
 * Get all form names
 */
export function getAllFormNames(): string[] {
  const formNames = new Set<string>();
  FORM_CONTROLS_CONFIG.forEach(control => {
    formNames.add(control.formName);
  });
  return Array.from(formNames).sort();
}

