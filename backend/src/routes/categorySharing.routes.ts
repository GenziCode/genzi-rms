import { Router, Request, Response, NextFunction } from 'express';
import { CategorySharingController } from '../controllers/categorySharing.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categorySharingController = new CategorySharingController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.get('/shared', categorySharingController.getSharedCategories);
router.post('/:categoryId/share', categorySharingController.shareCategory);
router.post('/:categoryId/make-public', categorySharingController.makeCategoryPublic);
router.post('/:categoryId/revoke-sharing', categorySharingController.revokeSharing);

export default router;