import { Request, Response, NextFunction } from 'express';
import { CategoryBackupService } from '../services/categoryBackup.service';
import { AppError } from '../utils/appError';

export class CategoryBackupController {
  private backupService: CategoryBackupService;

  constructor() {
    this.backupService = new CategoryBackupService();
  }

  createBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { description } = req.body;
      const backup = await this.backupService.createBackup(tenantId, description);
      res.status(201).json({ success: true, data: backup });
    } catch (error) {
      next(error);
    }
  };

  getBackups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const backups = await this.backupService.getBackups(tenantId);
      res.status(200).json({ success: true, data: backups });
    } catch (error) {
      next(error);
    }
  };

  restoreBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { backupId } = req.params;
      await this.backupService.restoreBackup(tenantId, backupId);
      res.status(200).json({ success: true, message: 'Backup restored successfully.' });
    } catch (error) {
      next(error);
    }
  };

  downloadBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { backupId } = req.params;
      const backupData = await this.backupService.downloadBackup(tenantId, backupId);
      
      res.setHeader('Content-Disposition', `attachment; filename="category-backup-${backupId}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(backupData);
    } catch (error) {
      next(error);
    }
  };
}