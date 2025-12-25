import { Router } from 'express';
import { CategorySecurityController } from '../controllers/categorySecurity.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const categorySecurityController = new CategorySecurityController();

// Apply middleware
router.use((req: any, res: any, next: any) => resolveTenant(req, res, next));
router.use((req: any, res: any, next: any) => authenticate(req, res, next));
router.use((req: any, res: any, next: any) => requireFormAccess('frmDefCategory')(req, res, next));

// Validation middleware
const securitySettingsValidation = [
  body('securitySettings')
    .isObject()
    .withMessage('Security settings must be an object'),
  body('securitySettings.securityLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Security level must be low, medium, high, or critical'),
  body('securitySettings.encryptionEnabled')
    .optional()
    .isBoolean()
    .withMessage('Encryption enabled must be a boolean'),
  body('securitySettings.accessLoggingEnabled')
    .optional()
    .isBoolean()
    .withMessage('Access logging enabled must be a boolean'),
  body('securitySettings.auditTrailEnabled')
    .optional()
    .isBoolean()
    .withMessage('Audit trail enabled must be a boolean'),
  body('securitySettings.ipWhitelist')
    .optional()
    .isArray()
    .withMessage('IP whitelist must be an array'),
  body('securitySettings.ipWhitelist.*')
    .optional()
    .isIP()
    .withMessage('Each IP in whitelist must be a valid IP address'),
  body('securitySettings.allowedRoles')
    .optional()
    .isArray()
    .withMessage('Allowed roles must be an array'),
  body('securitySettings.allowedRoles.*')
    .optional()
    .isString()
    .withMessage('Each allowed role must be a string'),
  body('securitySettings.allowedUsers')
    .optional()
    .isArray()
    .withMessage('Allowed users must be an array'),
  body('securitySettings.allowedUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Each allowed user must be a valid user ID'),
  body('securitySettings.blockedRoles')
    .optional()
    .isArray()
    .withMessage('Blocked roles must be an array'),
  body('securitySettings.blockedRoles.*')
    .optional()
    .isString()
    .withMessage('Each blocked role must be a string'),
  body('securitySettings.blockedUsers')
    .optional()
    .isArray()
    .withMessage('Blocked users must be an array'),
  body('securitySettings.blockedUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Each blocked user must be a valid user ID'),
  body('securitySettings.securityNotes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Security notes cannot exceed 1000 characters'),
  body('securitySettings.securityPolicies')
    .optional()
    .isArray()
    .withMessage('Security policies must be an array'),
  body('securitySettings.securityPolicies.*')
    .optional()
    .isString()
    .withMessage('Each security policy must be a string'),
  body('securitySettings.threatDetectionEnabled')
    .optional()
    .isBoolean()
    .withMessage('Threat detection enabled must be a boolean'),
  body('securitySettings.sensitiveDataProtection')
    .optional()
    .isBoolean()
    .withMessage('Sensitive data protection must be a boolean'),
  body('securitySettings.complianceRequirements')
    .optional()
    .isArray()
    .withMessage('Compliance requirements must be an array'),
  body('securitySettings.complianceRequirements.*')
    .optional()
    .isString()
    .isIn(['GDPR', 'HIPAA', 'SOX', 'PCI-DSS', 'ISO27001', 'CCPA'])
    .withMessage('Compliance requirement must be one of: GDPR, HIPAA, SOX, PCI-DSS, ISO27001, CCPA'),
];

const categoryIdValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
];

const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const policyValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('policyName')
    .isString()
    .notEmpty()
    .withMessage('Policy name is required'),
  body('policySettings')
    .optional()
    .isObject()
    .withMessage('Policy settings must be an object'),
];

// GET /api/category-security/:categoryId - Get security settings for a category
router.get(
  '/:categoryId',
  [
    ...categoryIdValidation
  ],
  validate,
  categorySecurityController.getCategorySecurity
);

// PUT /api/category-security/:categoryId - Update security settings for a category
router.put(
  '/:categoryId',
  [
    ...categoryIdValidation,
    ...securitySettingsValidation
  ],
  validate,
  categorySecurityController.setCategorySecurity
);

// DELETE /api/category-security/:categoryId - Remove security settings for a category
router.delete(
  '/:categoryId',
  [
    ...categoryIdValidation
  ],
  validate,
  categorySecurityController.removeCategorySecurity
);

// GET /api/category-security/user/:userId - Get categories accessible by a user based on security settings
router.get(
  '/user/:userId',
  [
    ...userIdValidation
  ],
  validate,
  categorySecurityController.getUserAccessibleCategories
);

// GET /api/category-security/:categoryId/access-check - Check if user has access to category
router.get(
  '/:categoryId/access-check',
  [
    ...categoryIdValidation
  ],
  validate,
  categorySecurityController.checkCategoryAccess
);

// POST /api/category-security/:categoryId/threat-detection - Enable threat detection for a category
router.post(
  '/:categoryId/threat-detection',
  [
    ...categoryIdValidation
  ],
  validate,
  categorySecurityController.enableThreatDetection
);

// POST /api/category-security/:categoryId/apply-policy - Apply a security policy to a category
router.post(
  '/:categoryId/apply-policy',
  [
    ...categoryIdValidation,
    ...policyValidation
  ],
  validate,
  categorySecurityController.applySecurityPolicy
);

// GET /api/category-security/admin-access-check - Check if user has admin access for security management
router.get(
  '/admin-access-check',
  validate,
  categorySecurityController.checkAdminAccess
);

// GET /api/category-security/user-permissions - Get user security permissions
router.get(
  '/user-permissions',
  validate,
  categorySecurityController.getUserSecurityPermissions
);

export default router;