import { Router } from 'express';
import { CategoryNotificationController } from '../controllers/categoryNotification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const categoryNotificationController = new CategoryNotificationController();

// All routes require authentication and tenant resolution
router.use(authenticate);
router.use(resolveTenant);
router.use(requireFormAccess('frmDefCategory'));

// Validation rules
const createNotificationValidation = [
  body('categoryId')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success'])
    .withMessage('Type must be info, warning, error, or success'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('recipientIds')
    .isArray({ min: 1 })
    .withMessage('Recipient IDs must be a non-empty array'),
  body('recipientIds.*')
    .isMongoId()
    .withMessage('Each recipient ID must be a valid MongoDB ID'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
];

const notificationIdValidation = [
  param('id').isMongoId().withMessage('Invalid notification ID'),
];

const categoryIdValidation = [
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
];

const getNotificationsValidation = [
  query('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success'])
    .withMessage('Type must be info, warning, error, or success'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  query('isRead')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRead must be true or false'),
  query('isAcknowledged')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isAcknowledged must be true or false'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'sentAt', 'priority'])
    .withMessage('Sort by must be createdAt, sentAt, or priority'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

/**
 * Category Notification Routes
 */

// POST /api/notifications/categories - Create a new category notification
router.post(
  '/',
  createNotificationValidation,
  validate,
  categoryNotificationController.createNotification
);

// GET /api/notifications/categories/:categoryId - Get notifications for a specific category
router.get(
  '/:categoryId',
  categoryIdValidation,
  getNotificationsValidation,
  validate,
  categoryNotificationController.getCategoryNotifications
);

// GET /api/notifications/my-notifications - Get notifications for the current user
router.get(
  '/my-notifications',
  getNotificationsValidation,
  validate,
  categoryNotificationController.getUserNotifications
);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put(
  '/:id/read',
  notificationIdValidation,
  validate,
  categoryNotificationController.markAsRead
);

// PUT /api/notifications/:id/acknowledge - Acknowledge a notification
router.put(
  '/:id/acknowledge',
  notificationIdValidation,
  validate,
  categoryNotificationController.acknowledge
);

// GET /api/notifications/unread-count - Get unread notification count
router.get(
  '/unread-count',
  validate,
  categoryNotificationController.getUnreadCount
);

// POST /api/notifications/categories/:categoryId/followers - Send notification to category followers
router.post(
  '/:categoryId/followers',
  categoryIdValidation,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
  ],
  validate,
  categoryNotificationController.sendToCategoryFollowers
);

// POST /api/notifications/categories/bulk-send - Bulk send notifications to multiple categories
router.post(
  '/bulk-send',
  [
    body('categoryIds')
      .isArray({ min: 1 })
      .withMessage('Category IDs must be a non-empty array'),
    body('categoryIds.*')
      .isMongoId()
      .withMessage('Each category ID must be a valid MongoDB ID'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message cannot exceed 1000 characters'),
    body('type')
      .optional()
      .isIn(['info', 'warning', 'error', 'success'])
      .withMessage('Type must be info, warning, error, or success'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Priority must be low, medium, high, or critical'),
    body('recipientIds')
      .isArray({ min: 1 })
      .withMessage('Recipient IDs must be a non-empty array'),
    body('recipientIds.*')
      .isMongoId()
      .withMessage('Each recipient ID must be a valid MongoDB ID'),
  ],
  validate,
  categoryNotificationController.bulkSendToCategories
);

// DELETE /api/notifications/:id - Delete a notification
router.delete(
  '/:id',
  notificationIdValidation,
  validate,
  categoryNotificationController.deleteNotification
);

export default router;