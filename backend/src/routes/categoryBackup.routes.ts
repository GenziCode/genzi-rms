import { Router, Request, Response, NextFunction } from 'express';
import { CategoryBackupController } from '../controllers/categoryBackup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categoryBackupController = new CategoryBackupController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.get('/backups', categoryBackupController.getBackups);
router.post('/backups', categoryBackupController.createBackup);
router.get('/backups/:backupId/download', categoryBackupController.downloadBackup);
router.post('/backups/:backupId/restore', categoryBackupController.restoreBackup);

export default router;