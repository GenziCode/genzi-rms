import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { TenantRequest } from '../types';
import { warehouseService, CreateWarehousePayload, UpdateWarehousePayload } from '../services/warehouse.service';
import { validate } from '../middleware/validation.middleware';
import { successResponse } from '../utils/response';

const baseValidations = [
  body('name').notEmpty().withMessage('Warehouse name is required'),
  body('code').notEmpty().withMessage('Warehouse code is required'),
  body('storeId').isMongoId().withMessage('Store is required'),
  body('description').optional().isString(),
  body('zones').optional().isArray(),
  body('zones.*.name').notEmpty(),
  body('zones.*.code').notEmpty(),
  body('zones.*.type')
    .optional()
    .isIn(['receiving', 'storage', 'picking', 'staging'])
    .withMessage('Invalid zone type'),
  body('bins').optional().isArray(),
  body('bins.*.code').notEmpty(),
  body('bins.*.zoneCode').notEmpty(),
  body('bins.*.capacity').optional().isNumeric(),
];

const updateValidations = baseValidations.map((rule) => rule.optional({ nullable: true }));
const idValidation = [param('id').isMongoId().withMessage('Invalid warehouse ID')];

const listValidations = [
  query('storeId').optional().isMongoId(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  validate,
];

export const warehouseValidations = {
  list: listValidations,
  getOne: [idValidation, validate],
  create: [...baseValidations, validate],
  update: [idValidation, ...updateValidations, validate],
  delete: [idValidation, validate],
};

export class WarehouseController {
  listWarehouses = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const data = await warehouseService.listWarehouses(tenantId, {
      storeId: req.query.storeId as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(data, 'Warehouses fetched successfully'));
  });

  getWarehouse = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const warehouse = await warehouseService.getWarehouseById(tenantId, req.params.id);
    res.json(successResponse(warehouse, 'Warehouse retrieved'));
  });

  createWarehouse = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const payload = req.body as CreateWarehousePayload;
    const warehouse = await warehouseService.createWarehouse(tenantId, payload);
    res.status(201).json(successResponse(warehouse, 'Warehouse created'));
  });

  updateWarehouse = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const payload = req.body as UpdateWarehousePayload;
    const warehouse = await warehouseService.updateWarehouse(tenantId, req.params.id, payload);
    res.json(successResponse(warehouse, 'Warehouse updated'));
  });

  deleteWarehouse = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    await warehouseService.deleteWarehouse(tenantId, req.params.id);
    res.json(successResponse(null, 'Warehouse deleted'));
  });
}

