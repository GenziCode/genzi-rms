import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { webhookService } from '../services/webhook.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class WebhookController {
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const result = await webhookService.getAll(req.user!.tenantId);
    sendSuccess(res, result, 'Webhooks retrieved successfully');
  });

  getById = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const webhook = await webhookService.getById(req.user!.tenantId, req.params.id);
    sendSuccess(res, { webhook }, 'Webhook retrieved successfully');
  });

  create = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const webhook = await webhookService.create(req.user!.tenantId, req.user!.id, req.body);
    sendSuccess(res, { webhook }, 'Webhook created successfully', 201);
  });

  update = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const webhook = await webhookService.update(req.user!.tenantId, req.params.id, req.body);
    sendSuccess(res, { webhook }, 'Webhook updated successfully');
  });

  delete = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    await webhookService.delete(req.user!.tenantId, req.params.id);
    sendSuccess(res, null, 'Webhook deleted successfully');
  });

  getLogs = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const { page, limit } = req.query;
    const result = await webhookService.getLogs(
      req.user!.tenantId,
      req.params.id,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );
    sendSuccess(res, result, 'Webhook logs retrieved successfully');
  });

  test = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const success = await webhookService.test(req.user!.tenantId, req.params.id);
    sendSuccess(res, { success }, success ? 'Test webhook sent' : 'Test webhook failed');
  });

  toggleActive = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const { active } = req.body;
    const webhook = await webhookService.toggleActive(req.user!.tenantId, req.params.id, active);
    sendSuccess(res, { webhook }, `Webhook ${active ? 'enabled' : 'disabled'}`);
  });
}

export const webhookController = new WebhookController();

