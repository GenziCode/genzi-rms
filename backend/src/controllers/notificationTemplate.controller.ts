import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { TenantRequest } from '../types';
import { validate } from '../middleware/validation.middleware';
import { notificationTemplateService } from '../services/notificationTemplate.service';
import { successResponse } from '../utils/response';
import { NotificationChannel } from '../models/notification.model';

const channelValues: NotificationChannel[] = ['email', 'sms', 'webhook', 'in_app'];

export const notificationTemplateValidations = {
  list: [
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('channel').optional().isIn(channelValues),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  create: [
    body('name').isString().trim().notEmpty(),
    body('key').isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString(),
    body('channels').isArray({ min: 1 }),
    body('channels.*').isIn(channelValues),
    body('subject').optional().isString(),
    body('content').isString().notEmpty(),
    body('samplePayload').optional().isObject(),
    body('changeSummary').optional().isString(),
    validate,
  ],
  templateId: [param('id').isMongoId().withMessage('Invalid template id'), validate],
  update: [
    param('id').isMongoId().withMessage('Invalid template id'),
    body('name').optional().isString().trim(),
    body('description').optional().isString(),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString(),
    body('channels').optional().isArray({ min: 1 }),
    body('channels.*').optional().isIn(channelValues),
    body('subject').optional().isString(),
    body('content').optional().isString(),
    body('samplePayload').optional().isObject(),
    body('changeSummary').optional().isString(),
    validate,
  ],
  createVersion: [
    param('id').isMongoId().withMessage('Invalid template id'),
    body('content').isString().notEmpty(),
    body('subject').optional().isString(),
    body('channels').optional().isArray({ min: 1 }),
    body('channels.*').optional().isIn(channelValues),
    body('changeSummary').optional().isString(),
    validate,
  ],
  preview: [
    body('templateId').optional().isMongoId(),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be provided when templateId is not supplied'),
    body('subject').optional().isString(),
    body('data').optional().isObject(),
    validate,
  ],
};

export class NotificationTemplateController {
  listTemplates = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const templates = await notificationTemplateService.listTemplates(tenantId, {
      search: req.query.search as string,
      channel: req.query.channel as NotificationChannel,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(templates, 'Notification templates fetched successfully'));
  });

  getTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const template = await notificationTemplateService.getTemplateById(tenantId, req.params.id);
    res.json(successResponse(template, 'Notification template fetched successfully'));
  });

  createTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const template = await notificationTemplateService.createTemplate(tenantId, userId, req.body);
    res.status(201).json(successResponse(template, 'Notification template created'));
  });

  updateTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const result = await notificationTemplateService.updateTemplate(
      tenantId,
      req.params.id,
      userId,
      req.body
    );
    res.json(successResponse(result.template, 'Notification template updated'));
  });

  deleteTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    await notificationTemplateService.deleteTemplate(tenantId, req.params.id);
    res.json(successResponse(null, 'Notification template deleted'));
  });

  createVersion = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const template = await notificationTemplateService.createVersion(
      tenantId,
      req.params.id,
      userId,
      req.body
    );
    res.json(successResponse(template, 'Notification template version created'));
  });

  previewTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const preview = await notificationTemplateService.previewTemplate(tenantId, req.body);
    res.json(successResponse(preview, 'Preview generated'));
  });
}

