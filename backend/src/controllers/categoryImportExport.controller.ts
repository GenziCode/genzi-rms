import { CategoryImportExportService } from '../services/categoryImportExport.service';
import multer from 'multer';

export class CategoryImportExportController {
  private categoryImportExportService: CategoryImportExportService;
  private upload: multer.Multer;

  constructor() {
    this.categoryImportExportService = new CategoryImportExportService();
    this.upload = multer({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
        }
      }
    });
  }
}
