import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { TenantRequest } from '../types';
import { validate } from '../middleware/validation.middleware';
import {
  notificationService,
  CreateNotificationPayload,
  ListNotificationFilters,
  UpsertRoutePayload,
  UpdatePreferencesPayload,
  ListInboxFilters,
} from '../services/notification.service';
import { NotificationChannel, NotificationStatus } from '../models/notification.model';
import { successResponse } from '../utils/response';

export const notificationValidations = {
  listInbox: [
    query('read').optional().isBoolean().toBoolean(),
    query('channel').optional().isIn(['email', 'sms', 'webhook', 'in_app']),
    query('search').optional().isString().trim(),
    query('includeArchived').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  list: [
    query('status')
      .optional()
      .isIn(['pending', 'scheduled', 'sending', 'delivered', 'failed', 'cancelled']),
    query('eventKey').optional().isString(),
    query('channel').optional().isIn(['email', 'sms', 'webhook', 'in_app']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    validate,
  ],
  markInboxRead: [param('id').isMongoId(), body('read').optional().isBoolean(), validate],
  deleteInbox: [param('id').isMongoId(), validate],
  create: [
    body('eventKey').isString().notEmpty(),
    body('channels').isArray({ min: 1 }),
    body('channels.*').isIn(['email', 'sms', 'webhook', 'in_app']),
    body('recipients').isArray({ min: 1 }),
    body('recipients.*.email').optional().isEmail(),
    body('recipients.*.phone').optional().isString(),
    body('recipients.*.webhookUrl').optional().isString(),
    validate,
  ],
  updateStatus: [
    param('id').isMongoId(),
    body('status')
      .isIn(['pending', 'scheduled', 'sending', 'delivered', 'failed', 'cancelled']),
    body('error').optional().isString(),
    body('deliveredAt').optional().isISO8601(),
    validate,
  ],
  upsertRoute: [
    body('eventKey').isString().notEmpty(),
    body('channels').isArray({ min: 1 }),
    body('channels.*.channel').isIn(['email', 'sms', 'webhook', 'in_app']),
    body('channels.*.enabled').isBoolean(),
    body('channels.*.quietHours.start').optional().isString(),
    body('channels.*.quietHours.end').optional().isString(),
    body('channels.*.fallback').optional().isArray(),
    body('channels.*.fallback.*').isIn(['email', 'sms', 'webhook', 'in_app']),
    validate,
  ],
  updatePreferences: [
    body('channels').isObject(),
    body('channels.email').optional().isObject(),
    body('channels.email.enabled').optional().isBoolean(),
    body('channels.email.quietHours.start').optional().isString(),
    body('channels.email.quietHours.end').optional().isString(),
    body('channels.sms').optional().isObject(),
    body('channels.webhook').optional().isObject(),
    body('channels.in_app').optional().isObject(),
    validate,
  ],
};

export class NotificationController {
  listInbox = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const filters = req.query as Partial<ListInboxFilters>;
    const data = await notificationService.listInbox(tenantId, userId, filters);
    res.json(successResponse(data, 'Inbox notifications fetched'));
  });

  listNotifications = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const filters = req.query as Partial<ListNotificationFilters>;
    const data = await notificationService.listNotifications(tenantId, {
      status: filters.status as NotificationStatus | undefined,
      eventKey: filters.eventKey as string,
      channel: filters.channel as NotificationChannel | undefined,
      limit: filters.limit ? Number(filters.limit) : undefined,
      page: filters.page ? Number(filters.page) : undefined,
    });
    res.json(successResponse(data, 'Notifications fetched'));
  });

  createNotification = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as CreateNotificationPayload;
    const notification = await notificationService.createNotification(tenantId, payload, userId);
    res.status(201).json(successResponse(notification, 'Notification queued'));
  });

  updateStatus = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { status, deliveredAt, error } = req.body as {
      status: NotificationStatus;
      deliveredAt?: string;
      error?: string;
    };
    const notification = await notificationService.updateStatus(tenantId, id, status, {
      deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
      error,
    });
    res.json(successResponse(notification, 'Notification status updated'));
  });

  listRoutes = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const routes = await notificationService.listRoutes(tenantId);
    res.json(successResponse(routes, 'Notification routes fetched'));
  });

  upsertRoute = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const route = await notificationService.upsertRoute(
      tenantId,
      req.body as UpsertRoutePayload,
      userId
    );
    res.json(successResponse(route, 'Notification route saved'));
  });

  getPreferences = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const preference = await notificationService.getPreferences(tenantId, userId);
    res.json(successResponse(preference, 'Notification preferences loaded'));
  });

  updatePreferences = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const preference = await notificationService.updatePreferences(
      tenantId,
      userId,
      req.body as UpdatePreferencesPayload
    );
    res.json(successResponse(preference, 'Notification preferences updated'));
  });

  markInboxRead = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const { id } = req.params;
    const read =
      typeof req.body.read === 'boolean'
        ? (req.body.read as boolean)
        : true;
    const item = await notificationService.markInboxRead(tenantId, userId, id, read);
    res.json(successResponse(item, 'Notification updated'));
  });

  markAllInboxRead = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const count = await notificationService.markAllInboxRead(tenantId, userId);
    res.json(successResponse({ count }, 'All notifications marked as read'));
  });

  deleteInboxItem = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const { id } = req.params;
    await notificationService.removeInboxItem(tenantId, userId, id);
    res.json(successResponse(null, 'Notification removed from inbox'));
  });
}

