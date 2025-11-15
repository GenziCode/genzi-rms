import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { TenantRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { validate } from '../middleware/validation.middleware';
import { successResponse } from '../utils/response';
import {
  CreateStockTransferPayload,
  stockTransferService,
  UpdateStockTransferPayload,
} from '../services/stockTransfer.service';

const baseValidations = [
  body('fromStoreId').isMongoId().withMessage('Source store is required'),
  body('toStoreId')
    .isMongoId()
    .withMessage('Destination store is required')
    .custom((value, { req }) => value !== req.body.fromStoreId)
    .withMessage('Destination store must be different from source store'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('notes').optional().isString().isLength({ max: 1000 }),
  body('watcherEmails')
    .optional()
    .isArray()
    .withMessage('Watcher emails must be an array'),
  body('watcherEmails.*')
    .optional()
    .isEmail()
    .withMessage('Watcher email must be valid'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Product ID is required for each item'),
  body('items.*.requestedQty')
    .isNumeric()
    .withMessage('Requested quantity is required')
    .custom((value) => Number(value) > 0)
    .withMessage('Requested quantity must be greater than zero'),
  body('items.*.sku').optional().isString(),
  body('items.*.name').optional().isString(),
  body('items.*.uom').optional().isString(),
  body('items.*.notes').optional().isString().isLength({ max: 500 }),
];

const updateValidations = baseValidations.map((rule) => rule.optional({ nullable: true }));

const idValidation = [param('id').isMongoId().withMessage('Invalid transfer ID')];

const statusNoteValidation = [
  body('note').optional().isString().isLength({ max: 500 }),
];

const decisionValidation = [
  body('note').optional().isString().isLength({ max: 500 }),
];

const listFiltersValidation = [
  query('status')
    .optional()
    .isIn([
      'draft',
      'pending_approval',
      'approved',
      'picking',
      'in_transit',
      'received',
      'cancelled',
      'rejected',
    ]),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  query('fromStoreId').optional().isMongoId(),
  query('toStoreId').optional().isMongoId(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const stockTransferValidations = {
  create: [baseValidations, validate],
  update: [idValidation, updateValidations, validate],
  submit: [idValidation, statusNoteValidation, validate],
  approve: [idValidation, decisionValidation, validate],
  reject: [idValidation, decisionValidation, validate],
  picking: [idValidation, statusNoteValidation, validate],
  inTransit: [idValidation, statusNoteValidation, validate],
  received: [idValidation, statusNoteValidation, validate],
  cancel: [idValidation, statusNoteValidation, validate],
  getOne: [idValidation, validate],
  list: [listFiltersValidation, validate],
};

export class StockTransferController {
  listTransfers = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const payload = await stockTransferService.listTransfers(tenantId, {
      status: req.query.status as any,
      priority: req.query.priority as any,
      fromStoreId: req.query.fromStoreId as string,
      toStoreId: req.query.toStoreId as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res.json(
      successResponse(payload, 'Stock transfers fetched successfully')
    );
  });

  getTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const transfer = await stockTransferService.getTransferById(
      tenantId,
      req.params.id
    );
    res.json(
      successResponse(stockTransferService.formatForResponse(transfer), 'Transfer retrieved')
    );
  });

  createTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as CreateStockTransferPayload;

    const transfer = await stockTransferService.createTransfer(
      tenantId,
      payload,
      userId
    );

    res
      .status(201)
      .json(
        successResponse(
          stockTransferService.formatForResponse(transfer),
          'Stock transfer created'
        )
      );
  });

  updateTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const payload = req.body as UpdateStockTransferPayload;

    const transfer = await stockTransferService.updateTransfer(
      tenantId,
      req.params.id,
      payload,
      userId
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Stock transfer updated'
      )
    );
  });

  submitTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.submitTransfer(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer submitted for approval'
      )
    );
  });

  approveTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.approveTransfer(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer approved'
      )
    );
  });

  rejectTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.rejectTransfer(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer rejected'
      )
    );
  });

  startPicking = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.startPicking(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Picking started'
      )
    );
  });

  markInTransit = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.markInTransit(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer marked in transit'
      )
    );
  });

  markReceived = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.markReceived(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer received'
      )
    );
  });

  cancelTransfer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const transfer = await stockTransferService.cancelTransfer(
      tenantId,
      req.params.id,
      userId,
      req.body.note
    );

    res.json(
      successResponse(
        stockTransferService.formatForResponse(transfer),
        'Transfer cancelled'
      )
    );
  });
}

