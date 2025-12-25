import { Router } from 'express';  
import { CategoryImportExportController } from '../controllers/categoryImportExport.controller';  
import { authenticate } from '../middleware/auth.middleware';  
import { resolveTenant } from '../middleware/tenant.middleware';  
  
const router = Router();  
const categoryImportExportController = new CategoryImportExportController();  
  
// All routes require authentication and tenant resolution  
router.use(authenticate);  
router.use(resolveTenant);  
  
// Export routes  
router.get('/export/csv', categoryImportExportController.exportCategoriesCSV);  
router.get('/export/excel', categoryImportExportController.exportCategoriesExcel);  
  
// Import routes  
router.post('/import/csv', categoryImportExportController.importCategoriesFromCSV);  
router.post('/import/excel', categoryImportExportController.importCategoriesFromExcel);  
  
// Template routes  
router.get('/template/csv', categoryImportExportController.downloadCSVTemplate);  
router.get('/template/excel', categoryImportExportController.downloadExcelTemplate);  
  
export default router; 
