import { Router } from 'express';
import { CategoryReportsController } from '../controllers/categoryReports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { query } from 'express-validator';

const router = Router();
const categoryReportsController = new CategoryReportsController();

// All routes require authentication and tenant resolution
router.use(authenticate);
router.use(resolveTenant);
router.use(requireFormAccess('frmDefCategory'));

// Validation rules
const exportReportValidation = [
  query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Format must be json, csv, or pdf'),
  query('type').optional().isIn(['comprehensive', 'usage', 'performance', 'hierarchy']).withMessage('Type must be comprehensive, usage, performance, or hierarchy'),
];

/**
 * Category Reports Routes
 */
// GET /api/reports/categories/comprehensive - Generate comprehensive category report
router.get('/comprehensive', categoryReportsController.generateComprehensiveReport);

// GET /api/reports/categories/usage - Generate category usage report
router.get('/usage', categoryReportsController.generateUsageReport);

// GET /api/reports/categories/performance - Generate category performance report
router.get('/performance', categoryReportsController.generatePerformanceReport);

// GET /api/reports/categories/hierarchy - Generate category hierarchy report
router.get('/hierarchy', categoryReportsController.generateHierarchyReport);

// GET /api/reports/categories/export - Export category reports in various formats
router.get('/export', exportReportValidation, validate, categoryReportsController.exportReport);

export default router;