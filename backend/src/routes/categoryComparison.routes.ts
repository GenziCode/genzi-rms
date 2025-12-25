import { Router, Request, Response, NextFunction } from 'express';
import { CategoryComparisonController } from '../controllers/categoryComparison.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categoryComparisonController = new CategoryComparisonController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.post('/compare', categoryComparisonController.compareCategories);
router.get('/similar/:categoryId', categoryComparisonController.findSimilarCategories);

export default router;