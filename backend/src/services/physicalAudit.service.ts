import mongoose, { FilterQuery } from 'mongoose';
import { getTenantConnection } from '../config/database';
import {
  IPhysicalAuditEntry,
  IPhysicalAuditSession,
  PhysicalAuditSessionSchema,
  PhysicalAuditStatus,
  PhysicalAuditType,
} from '../models/physicalAudit.model';
import { BadRequestError, NotFoundError } from '../utils/appError';

export interface AuditEntryInput {
  productId: string;
  sku?: string;
  name?: string;
  category?: string;
  expectedQty: number;
}

export interface CreatePhysicalAuditPayload {
  name: string;
  type: PhysicalAuditType;
  storeId: string;
  scheduledFor?: Date;
  dueDate?: Date;
  instructions?: string;
  counters?: Array<{ userId: string; role?: string }>;
  entries: AuditEntryInput[];
}

export type UpdatePhysicalAuditPayload = Partial<CreatePhysicalAuditPayload>;

export interface RecordCountsPayload {
  entries: Array<{
    productId: string;
    countedQty: number;
    notes?: string;
  }>;
}

export interface PhysicalAuditFilters {
  status?: PhysicalAuditStatus;
  type?: PhysicalAuditType;
  storeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class PhysicalAuditService {
  private populateOptions = [
    { path: 'store', select: 'name code storeCode' },
    { path: 'counters.user', select: 'firstName lastName email' },
    { path: 'entries.product', select: 'name sku unit' },
  ];

  private async getModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IPhysicalAuditSession>('PhysicalAuditSession', PhysicalAuditSessionSchema);
  }

  private async generateReference() {
    const seed = Date.now().toString(36);
    return `AUD-${seed.toUpperCase()}`;
  }

  private buildEntries(entries: AuditEntryInput[]): IPhysicalAuditEntry[] {
    if (!entries?.length) {
      throw new BadRequestError('At least one entry is required');
    }
    return entries.map((entry) => ({
      product: new mongoose.Types.ObjectId(entry.productId),
      sku: entry.sku,
      name: entry.name,
      category: entry.category,
      expectedQty: entry.expectedQty,
      status: 'pending',
    }));
  }

  private ensureStatus(current: PhysicalAuditStatus, allowed: PhysicalAuditStatus[]) {
    if (!allowed.includes(current)) {
      throw new BadRequestError(
        `Invalid state transition from ${current}. Allowed: ${allowed.join(', ')}`
      );
    }
  }

  async listSessions(tenantId: string, filters: PhysicalAuditFilters = {}) {
    const PhysicalAudit = await this.getModel(tenantId);
    const query: FilterQuery<IPhysicalAuditSession> = {};

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.storeId) query.store = filters.storeId;
    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    const limit = Math.min(filters.limit ?? 25, 100);
    const page = Math.max(filters.page ?? 1, 1);

    const sessions = await PhysicalAudit.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(this.populateOptions)
      .lean();

    const total = await PhysicalAudit.countDocuments(query);

    return {
      records: sessions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionById(tenantId: string, id: string) {
    const PhysicalAudit = await this.getModel(tenantId);
    const session = await PhysicalAudit.findById(id).populate(this.populateOptions);
    if (!session) {
      throw new NotFoundError('Audit session not found');
    }
    return session;
  }

  async createSession(
    tenantId: string,
    payload: CreatePhysicalAuditPayload,
    userId: string
  ) {
    const PhysicalAudit = await this.getModel(tenantId);
    const session = new PhysicalAudit({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: payload.name,
      reference: await this.generateReference(),
      store: new mongoose.Types.ObjectId(payload.storeId),
      type: payload.type,
      status: payload.scheduledFor ? 'scheduled' : 'draft',
      scheduledFor: payload.scheduledFor,
      dueDate: payload.dueDate,
      instructions: payload.instructions,
      counters: payload.counters?.map((counter) => ({
        user: new mongoose.Types.ObjectId(counter.userId),
        role: counter.role,
        status: 'pending',
      })),
      entries: this.buildEntries(payload.entries),
      timeline: {
        createdAt: new Date(),
      },
      createdBy: new mongoose.Types.ObjectId(userId),
      updatedBy: new mongoose.Types.ObjectId(userId),
    });

    await session.save();
    return session;
  }

  async updateSession(
    tenantId: string,
    id: string,
    payload: UpdatePhysicalAuditPayload,
    userId: string
  ) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['draft', 'scheduled']);

    if (payload.name !== undefined) session.name = payload.name;
    if (payload.type) session.type = payload.type;
    if (payload.storeId) session.store = new mongoose.Types.ObjectId(payload.storeId);
    if (payload.scheduledFor !== undefined) session.scheduledFor = payload.scheduledFor;
    if (payload.dueDate !== undefined) session.dueDate = payload.dueDate;
    if (payload.instructions !== undefined) session.instructions = payload.instructions;
    if (payload.counters) {
      session.counters = payload.counters.map((counter) => ({
        user: new mongoose.Types.ObjectId(counter.userId),
        role: counter.role,
        status: 'pending',
      }));
    }
    if (payload.entries) {
      session.entries = this.buildEntries(payload.entries);
    }

    session.updatedBy = new mongoose.Types.ObjectId(userId);
    await session.save();
    return session;
  }

  async startCounting(tenantId: string, id: string, userId: string) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['draft', 'scheduled']);

    session.status = 'counting';
    session.timeline.startedAt = new Date();
    session.updatedBy = new mongoose.Types.ObjectId(userId);

    if (session.counters?.length) {
      session.counters = session.counters.map((counter) => ({
        ...counter,
        status: counter.status === 'complete' ? counter.status : 'active',
      }));
    }

    await session.save();
    return session;
  }

  async recordCounts(
    tenantId: string,
    id: string,
    payload: RecordCountsPayload,
    userId: string
  ) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['counting']);

    const map = new Map(
      payload.entries.map((entry) => [entry.productId.toString(), entry])
    );

    session.entries = session.entries.map((entry) => {
      const productId = entry.product.toString();
      if (!map.has(productId)) {
        return entry;
      }
      const data = map.get(productId)!;
      const countedQty = data.countedQty;
      const variance = countedQty - entry.expectedQty;
      return {
        ...entry,
        countedQty,
        variance,
        status: variance === 0 ? 'counted' : Math.abs(variance) <= 0.01 ? 'counted' : 'needs_review',
        notes: data.notes,
        lastCountedBy: new mongoose.Types.ObjectId(userId),
        lastCountedAt: new Date(),
      };
    });

    await session.save();
    return session;
  }

  async moveToReview(tenantId: string, id: string, userId: string) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['counting']);

    session.status = 'review';
    session.updatedBy = new mongoose.Types.ObjectId(userId);
    await session.save();
    return session;
  }

  async completeSession(tenantId: string, id: string, userId: string) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['review']);

    session.status = 'completed';
    session.timeline.completedAt = new Date();
    session.updatedBy = new mongoose.Types.ObjectId(userId);
    await session.save();
    return session;
  }

  async cancelSession(tenantId: string, id: string, reason: string | undefined, userId: string) {
    const session = await this.getSessionById(tenantId, id);
    this.ensureStatus(session.status, ['draft', 'scheduled']);

    session.status = 'cancelled';
    session.timeline.cancelledAt = new Date();
    session.instructions = reason ?? session.instructions;
    session.updatedBy = new mongoose.Types.ObjectId(userId);
    await session.save();
    return session;
  }

  formatForResponse(session: IPhysicalAuditSession) {
    return session.toJSON();
  }
}

export const physicalAuditService = new PhysicalAuditService();

