import { Router, Request, Response, NextFunction } from 'express';
import { CategoryAuditController } from '../controllers/categoryAudit.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categoryAuditController = new CategoryAuditController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.get('/:categoryId/audit', categoryAuditController.getAuditTrail);

export default router;