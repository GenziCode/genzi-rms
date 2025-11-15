import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { TenantRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { validate } from '../middleware/validation.middleware';
import { successResponse } from '../utils/response';
import {
  CreatePhysicalAuditPayload,
  physicalAuditService,
  RecordCountsPayload,
  UpdatePhysicalAuditPayload,
} from '../services/physicalAudit.service';

const baseValidations = [
  body('name').isString().notEmpty().withMessage('Audit name is required'),
  body('type')
    .isIn(['cycle', 'blind', 'full'])
    .withMessage('Audit type must be cycle, blind, or full'),
  body('storeId').isMongoId().withMessage('Store is required'),
  body('scheduledFor').optional().isISO8601(),
  body('dueDate').optional().isISO8601(),
  body('instructions').optional().isString(),
  body('counters').optional().isArray(),
  body('counters.*.userId').optional().isMongoId(),
  body('counters.*.role').optional().isString(),
  body('entries')
    .isArray({ min: 1 })
    .withMessage('At least one product entry is required'),
  body('entries.*.productId').isMongoId().withMessage('Product ID is required'),
  body('entries.*.expectedQty').isNumeric().withMessage('Expected quantity is required'),
  body('entries.*.sku').optional().isString(),
  body('entries.*.name').optional().isString(),
  body('entries.*.category').optional().isString(),
];

const updateValidations = baseValidations.map((rule) => rule.optional({ nullable: true }));

const idValidation = [param('id').isMongoId().withMessage('Invalid audit ID')];

const recordCountsValidation = [
  param('id').isMongoId().withMessage('Invalid audit ID'),
  body('entries').isArray({ min: 1 }).withMessage('Provide at least one count entry'),
  body('entries.*.productId').isMongoId().withMessage('Product ID required'),
  body('entries.*.countedQty').isNumeric().withMessage('Counted quantity required'),
  body('entries.*.notes').optional().isString(),
];

const listFiltersValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'scheduled', 'counting', 'review', 'completed', 'cancelled']),
  query('type').optional().isIn(['cycle', 'blind', 'full']),
  query('storeId').optional().isMongoId(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const physicalAuditValidations = {
  list: [listFiltersValidation, validate],
  getOne: [idValidation, validate],
  create: [baseValidations, validate],
  update: [idValidation, updateValidations, validate],
  start: [idValidation, validate],
  record: [recordCountsValidation, validate],
  review: [idValidation, validate],
  complete: [idValidation, validate],
  cancel: [
    idValidation,
    body('reason').optional().isString(),
    validate,
  ],
};

export class PhysicalAuditController {
  listSessions = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const data = await physicalAuditService.listSessions(tenantId, {
      status: req.query.status as any,
      type: req.query.type as any,
      storeId: req.query.storeId as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(data, 'Audit sessions fetched successfully'));
  });

  getSession = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const session = await physicalAuditService.getSessionById(tenantId, req.params.id);
    res.json(successResponse(physicalAuditService.formatForResponse(session), 'Audit session retrieved'));
  });

  createSession = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as CreatePhysicalAuditPayload;

    const session = await physicalAuditService.createSession(tenantId, payload, userId);
    res.status(201).json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session created'
      )
    );
  });

  updateSession = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as UpdatePhysicalAuditPayload;

    const session = await physicalAuditService.updateSession(tenantId, req.params.id, payload, userId);
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session updated'
      )
    );
  });

  startCounting = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const session = await physicalAuditService.startCounting(tenantId, req.params.id, userId);
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session started'
      )
    );
  });

  recordCounts = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as RecordCountsPayload;

    const session = await physicalAuditService.recordCounts(tenantId, req.params.id, payload, userId);
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Counts recorded'
      )
    );
  });

  moveToReview = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const session = await physicalAuditService.moveToReview(tenantId, req.params.id, userId);
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session moved to review'
      )
    );
  });

  completeSession = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const session = await physicalAuditService.completeSession(tenantId, req.params.id, userId);
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session completed'
      )
    );
  });

  cancelSession = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const session = await physicalAuditService.cancelSession(
      tenantId,
      req.params.id,
      req.body.reason,
      userId
    );
    res.json(
      successResponse(
        physicalAuditService.formatForResponse(session),
        'Audit session cancelled'
      )
    );
  });
}

