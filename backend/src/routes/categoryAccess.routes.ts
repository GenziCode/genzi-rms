import { Router, Request, Response, NextFunction } from 'express';
import { CategoryAccessController } from '../controllers/categoryAccess.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categoryAccessController = new CategoryAccessController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.post('/:categoryId/access/roles', categoryAccessController.setRolePermissions);
router.post('/:categoryId/access/users/:userId', categoryAccessController.setUserPermissions);
router.get('/:categoryId/access/check/:permission', categoryAccessController.checkPermission);

export default router;