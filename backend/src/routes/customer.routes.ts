import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import {
  createCustomerValidation,
  updateCustomerValidation,
  customerIdParamValidation,
  getCustomersValidation,
  adjustPointsValidation,
  getPurchaseHistoryValidation,
} from '../validations/customer.validations';

const router = Router();
const customerController = new CustomerController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use(authenticate);

/**
 * Routes
 */

// POST /api/customers - Create customer
router.post(
  '/',
  [...createCustomerValidation, validate],
  auditMiddleware({ action: 'create', entityType: 'customer' }),
  customerController.createCustomer
);

// GET /api/customers - Get all customers
router.get('/', [...getCustomersValidation, validate], customerController.getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', [...customerIdParamValidation, validate], customerController.getCustomerById);

// PUT /api/customers/:id - Update customer
router.put(
  '/:id',
  [...updateCustomerValidation, validate],
  auditMiddleware({ action: 'update', entityType: 'customer' }),
  customerController.updateCustomer
);

// DELETE /api/customers/:id - Delete customer
router.delete(
  '/:id',
  [...customerIdParamValidation, validate],
  auditMiddleware({ action: 'delete', entityType: 'customer' }),
  customerController.deleteCustomer
);

// GET /api/customers/:id/history - Get purchase history
router.get(
  '/:id/history',
  [...getPurchaseHistoryValidation, validate],
  customerController.getPurchaseHistory
);

// POST /api/customers/:id/points - Adjust loyalty points
router.post(
  '/:id/points',
  [...adjustPointsValidation, validate],
  auditMiddleware({ action: 'update', entityType: 'customer' }),
  customerController.adjustLoyaltyPoints
);

export default router;
