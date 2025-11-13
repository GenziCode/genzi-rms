import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { webhookController } from '../controllers/webhook.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { isValidMongoId } from '../utils/validators';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
router.use(authenticate, resolveTenant);

router.get('/', webhookController.getAll);
router.get('/:id', [param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')), validate], webhookController.getById);
router.post('/', [
  body('url').isURL().withMessage('Valid URL required'),
  body('events').isArray({ min: 1 }).withMessage('At least one event required'),
  validate
], auditMiddleware({ action: 'create', entityType: 'webhook' }), webhookController.create);
router.put('/:id', [param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')), validate], auditMiddleware({
  action: 'update',
  entityType: 'webhook',
  resolveEntityId: ({ req }) => req.params.id,
}), webhookController.update);
router.delete('/:id', [param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')), validate], auditMiddleware({
  action: 'delete',
  entityType: 'webhook',
  resolveEntityId: ({ req }) => req.params.id,
}), webhookController.delete);
router.get('/:id/logs', [param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')), validate], webhookController.getLogs);
router.post('/:id/test', [param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')), validate], auditMiddleware({
  action: 'update',
  entityType: 'webhook',
  resolveEntityId: ({ req }) => req.params.id,
  metadataBuilder: () => ({ action: 'test' }),
}), webhookController.test);
router.patch('/:id/toggle', [
  param('id').custom(v => isValidMongoId(v) || Promise.reject('Invalid ID')),
  body('active').isBoolean().withMessage('Active must be boolean'),
  validate
], auditMiddleware({
  action: 'update',
  entityType: 'webhook',
  resolveEntityId: ({ req }) => req.params.id,
  metadataBuilder: ({ req }) => ({ active: req.body?.active }),
}), webhookController.toggleActive);

export default router;

