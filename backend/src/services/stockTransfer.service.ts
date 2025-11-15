import mongoose, { FilterQuery } from 'mongoose';
import { getTenantConnection } from '../config/database';
import {
  IStockTransfer,
  IStockTransferItem,
  StockTransferPriority,
  StockTransferSchema,
  StockTransferStatus,
} from '../models/stockTransfer.model';
import { BadRequestError, NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface TransferItemInput {
  productId: string;
  sku?: string;
  name?: string;
  requestedQty: number;
  approvedQty?: number;
  pickedQty?: number;
  receivedQty?: number;
  uom?: string;
  notes?: string;
}

export interface CreateStockTransferPayload {
  fromStoreId: string;
  toStoreId: string;
  items: TransferItemInput[];
  priority?: StockTransferPriority;
  reason?: string;
  notes?: string;
  watcherEmails?: string[];
  reference?: string;
}

export type UpdateStockTransferPayload = Partial<CreateStockTransferPayload>;

export interface ListTransfersFilters {
  status?: StockTransferStatus;
  priority?: StockTransferPriority;
  fromStoreId?: string;
  toStoreId?: string;
  search?: string;
  limit?: number;
  page?: number;
}

class StockTransferService {
  private populateOptions = [
    { path: 'fromStore', select: 'name code storeCode' },
    { path: 'toStore', select: 'name code storeCode' },
    { path: 'items.product', select: 'name sku unit' },
    {
      path: 'activity.performedBy',
      select: 'firstName lastName',
    },
  ];

  private async getModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IStockTransfer>('StockTransfer', StockTransferSchema);
  }

  private async generateReference(tenantId: string) {
    const sequence = Date.now().toString(36);
    return `STR-${sequence.toUpperCase()}`;
  }

  private mapItems(items: TransferItemInput[]): IStockTransferItem[] {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('At least one transfer item is required');
    }

    return items.map((item) => {
      if (item.requestedQty <= 0) {
        throw new BadRequestError('Requested quantity must be greater than zero');
      }

      return {
        product: new mongoose.Types.ObjectId(item.productId),
        sku: item.sku,
        name: item.name,
        requestedQty: item.requestedQty,
        approvedQty: item.approvedQty,
        pickedQty: item.pickedQty,
        receivedQty: item.receivedQty,
        uom: item.uom,
        notes: item.notes,
      };
    });
  }

  private ensureDifferentStores(from: string, to: string) {
    if (from === to) {
      throw new BadRequestError('Source and destination stores must be different');
    }
  }

  private async findById(tenantId: string, id: string) {
    const StockTransfer = await this.getModel(tenantId);
    const transfer = await StockTransfer.findById(id);
    if (!transfer) {
      throw new NotFoundError('Stock transfer not found');
    }
    return transfer;
  }

  private ensureEditable(status: StockTransferStatus) {
    if (!['draft'].includes(status)) {
      throw new BadRequestError('Only draft transfers can be edited');
    }
  }

  private ensureStatus(current: StockTransferStatus, allowed: StockTransferStatus[]) {
    if (!allowed.includes(current)) {
      throw new BadRequestError(
        `Invalid status transition from ${current}. Expected: ${allowed.join(', ')}`
      );
    }
  }

  private addActivity(
    transfer: IStockTransfer,
    action: string,
    userId: string,
    message?: string,
    performedByName?: string
  ) {
    transfer.activity.push({
      action,
      message,
      performedBy: new mongoose.Types.ObjectId(userId),
      performedByName,
      createdAt: new Date(),
    });
  }

  async listTransfers(tenantId: string, filters: ListTransfersFilters = {}) {
    const StockTransfer = await this.getModel(tenantId);
    const query: FilterQuery<IStockTransfer> = {};

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.fromStoreId) query.fromStore = filters.fromStoreId;
    if (filters.toStoreId) query.toStore = filters.toStoreId;
    if (filters.search) {
      query.reference = { $regex: filters.search, $options: 'i' };
    }

    const limit = Math.min(filters.limit ?? 25, 100);
    const page = Math.max(filters.page ?? 1, 1);

    const transfers = await StockTransfer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(this.populateOptions)
      .lean();

    const total = await StockTransfer.countDocuments(query);

    return {
      records: transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransferById(tenantId: string, id: string) {
    const StockTransfer = await this.getModel(tenantId);
    const transfer = await StockTransfer.findById(id).populate(this.populateOptions);

    if (!transfer) {
      throw new NotFoundError('Stock transfer not found');
    }
    return transfer;
  }

  async createTransfer(
    tenantId: string,
    payload: CreateStockTransferPayload,
    userId: string
  ) {
    this.ensureDifferentStores(payload.fromStoreId, payload.toStoreId);
    const StockTransfer = await this.getModel(tenantId);

    const transfer = new StockTransfer({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      reference: payload.reference || (await this.generateReference(tenantId)),
      fromStore: new mongoose.Types.ObjectId(payload.fromStoreId),
      toStore: new mongoose.Types.ObjectId(payload.toStoreId),
      items: this.mapItems(payload.items),
      priority: payload.priority || 'normal',
      reason: payload.reason,
      notes: payload.notes,
      watcherEmails: payload.watcherEmails?.map((email) => email.trim().toLowerCase()),
      status: 'draft',
      timeline: {
        createdAt: new Date(),
      },
      approvals: {
        requestedBy: new mongoose.Types.ObjectId(userId),
        requestedAt: new Date(),
      },
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    this.addActivity(transfer, 'created', userId, 'Transfer created');
    logger.info(`Stock transfer created: ${transfer.reference}`);

    await transfer.save();
    return transfer;
  }

  async updateTransfer(
    tenantId: string,
    id: string,
    payload: UpdateStockTransferPayload,
    userId: string
  ) {
    const transfer = await this.findById(tenantId, id);
    this.ensureEditable(transfer.status);

    if (payload.fromStoreId) {
      transfer.fromStore = new mongoose.Types.ObjectId(payload.fromStoreId);
    }
    if (payload.toStoreId) {
      transfer.toStore = new mongoose.Types.ObjectId(payload.toStoreId);
    }
    if (transfer.fromStore.equals(transfer.toStore)) {
      throw new BadRequestError('Source and destination stores must be different');
    }

    if (payload.items) {
      transfer.items = this.mapItems(payload.items);
    }
    if (payload.priority) transfer.priority = payload.priority;
    if (payload.reason !== undefined) transfer.reason = payload.reason;
    if (payload.notes !== undefined) transfer.notes = payload.notes;
    if (payload.watcherEmails) {
      transfer.watcherEmails = payload.watcherEmails.map((email) => email.trim().toLowerCase());
    }

    transfer.updatedBy = new mongoose.Types.ObjectId(userId);
    this.addActivity(transfer, 'updated', userId, 'Transfer details updated');

    await transfer.save();
    return transfer;
  }

  async submitTransfer(tenantId: string, id: string, userId: string, message?: string) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['draft']);

    transfer.status = 'pending_approval';
    transfer.timeline.submittedAt = new Date();
    transfer.approvals = {
      ...(transfer.approvals || {}),
      requestedBy: new mongoose.Types.ObjectId(userId),
      requestedAt: new Date(),
      decisionNotes: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      rejectedBy: undefined,
      rejectedAt: undefined,
    };
    this.addActivity(transfer, 'submitted', userId, message || 'Transfer submitted for approval');

    await transfer.save();
    return transfer;
  }

  async approveTransfer(
    tenantId: string,
    id: string,
    userId: string,
    decisionNotes?: string
  ) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['pending_approval']);

    transfer.status = 'approved';
    transfer.timeline.approvedAt = new Date();
    transfer.approvals = {
      ...(transfer.approvals || {}),
      approvedBy: new mongoose.Types.ObjectId(userId),
      approvedAt: new Date(),
      decisionNotes,
    };
    this.addActivity(transfer, 'approved', userId, decisionNotes || 'Transfer approved');

    await transfer.save();
    return transfer;
  }

  async rejectTransfer(
    tenantId: string,
    id: string,
    userId: string,
    decisionNotes?: string
  ) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['pending_approval']);

    transfer.status = 'rejected';
    transfer.timeline.rejectedAt = new Date();
    transfer.approvals = {
      ...(transfer.approvals || {}),
      rejectedBy: new mongoose.Types.ObjectId(userId),
      rejectedAt: new Date(),
      decisionNotes,
    };
    this.addActivity(transfer, 'rejected', userId, decisionNotes || 'Transfer rejected');

    await transfer.save();
    return transfer;
  }

  async startPicking(tenantId: string, id: string, userId: string, note?: string) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['approved']);

    transfer.status = 'picking';
    transfer.timeline.pickingStartedAt = new Date();
    this.addActivity(transfer, 'picking_started', userId, note || 'Picking started');

    await transfer.save();
    return transfer;
  }

  async markInTransit(tenantId: string, id: string, userId: string, note?: string) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['approved', 'picking']);

    transfer.status = 'in_transit';
    transfer.timeline.inTransitAt = new Date();
    this.addActivity(transfer, 'in_transit', userId, note || 'Transfer in transit');

    await transfer.save();
    return transfer;
  }

  async markReceived(tenantId: string, id: string, userId: string, note?: string) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['in_transit']);

    transfer.status = 'received';
    transfer.timeline.receivedAt = new Date();
    this.addActivity(transfer, 'received', userId, note || 'Transfer received');

    await transfer.save();
    return transfer;
  }

  async cancelTransfer(tenantId: string, id: string, userId: string, reason?: string) {
    const transfer = await this.findById(tenantId, id);
    this.ensureStatus(transfer.status, ['draft', 'pending_approval', 'approved']);

    transfer.status = 'cancelled';
    transfer.timeline.cancelledAt = new Date();
    this.addActivity(transfer, 'cancelled', userId, reason || 'Transfer cancelled');

    await transfer.save();
    return transfer;
  }

  formatForResponse(transfer: IStockTransfer) {
    const json = transfer.toJSON();
    return {
      ...json,
      id: transfer._id,
    };
  }
}

export const stockTransferService = new StockTransferService();

