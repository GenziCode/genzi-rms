import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { notificationController } from '../controllers/notification.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { isValidMongoId } from '../utils/validators';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();

// Apply authentication and tenant resolution to all routes
router.use(authenticate, resolveTenant);

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', notificationController.updatePreferences);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * GET /api/notifications
 * Get all notifications
 */
router.get(
  '/',
  [
    query('type')
      .optional()
      .isIn(['system', 'sale', 'payment', 'inventory', 'order', 'customer', 'alert', 'reminder'])
      .withMessage('Invalid notification type'),
    
    query('read')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Read must be true or false'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    validate,
  ],
  notificationController.getAll
);

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid notification ID');
        }
        return true;
      }),
    validate,
  ],
  notificationController.getById
);

/**
 * POST /api/notifications
 * Create notification
 */
router.post(
  '/',
  [
    body('userId')
      .optional()
      .custom((value) => {
        if (value && !isValidMongoId(value)) {
          throw new Error('Invalid user ID');
        }
        return true;
      }),
    
    body('type')
      .isIn(['system', 'sale', 'payment', 'inventory', 'order', 'customer', 'alert', 'reminder'])
      .withMessage('Invalid notification type'),
    
    body('channel')
      .isIn(['in_app', 'email', 'sms', 'push'])
      .withMessage('Invalid channel'),
    
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
    
    validate,
  ],
  notificationController.create
);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch(
  '/:id/read',
  [
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid notification ID');
        }
        return true;
      }),
    validate,
  ],
  notificationController.markAsRead
);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid notification ID');
        }
        return true;
      }),
    validate,
  ],
  notificationController.delete
);

/**
 * POST /api/notifications/email
 * Send email directly
 */
router.post(
  '/email',
  [
    body('to')
      .trim()
      .isEmail()
      .withMessage('Valid email is required'),
    
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required'),
    
    body('html')
      .trim()
      .notEmpty()
      .withMessage('HTML content is required'),
    
    body('text')
      .optional()
      .trim(),
    
    validate,
  ],
  notificationController.sendEmail
);

/**
 * POST /api/notifications/sms
 * Send SMS directly
 */
router.post(
  '/sms',
  [
    body('to')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 160 })
      .withMessage('SMS message must be 160 characters or less'),
    
    validate,
  ],
  notificationController.sendSMS
);

/**
 * POST /api/notifications/broadcast
 * Broadcast notification to all users
 */
router.post(
  '/broadcast',
  [
    body('type')
      .optional()
      .isIn(['system', 'sale', 'payment', 'inventory', 'order', 'customer', 'alert', 'reminder'])
      .withMessage('Invalid notification type'),
    
    body('channels')
      .optional()
      .isArray({ min: 1, max: 4 })
      .withMessage('Channels must be an array with at least one entry'),
    
    body('channels.*')
      .optional()
      .isIn(['in_app', 'email', 'sms', 'push'])
      .withMessage('Invalid channel'),
    
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
    
    body('actionUrl')
      .optional()
      .trim()
      .isURL()
      .withMessage('actionUrl must be a valid URL'),
    
    validate,
  ],
  notificationController.broadcast
);

/**
 * POST /api/notifications/test-email
 * Test email configuration
 */
router.post(
  '/test-email',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required'),
    validate,
  ],
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: (req) => ({
      section: 'communications',
      channel: 'email',
      target: req.body.email,
      test: true,
    }),
  }),
  notificationController.testEmail
);

/**
 * POST /api/notifications/test-sms
 * Test SMS configuration
 */
router.post(
  '/test-sms',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    validate,
  ],
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: (req) => ({
      section: 'communications',
      channel: 'sms',
      target: req.body.phone,
      test: true,
    }),
  }),
  notificationController.testSMS
);

export default router;

