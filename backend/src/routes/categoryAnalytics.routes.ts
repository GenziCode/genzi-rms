import { Router, Request, Response, NextFunction } from 'express';
import { CategoryAnalyticsController } from '../controllers/categoryAnalytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const categoryAnalyticsController = new CategoryAnalyticsController();

router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));

router.get('/overview', categoryAnalyticsController.getOverview);
router.get('/performance', categoryAnalyticsController.getPerformance);

export default router;