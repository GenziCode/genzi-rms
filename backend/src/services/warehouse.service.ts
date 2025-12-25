import mongoose from 'mongoose';
import { getTenantConnection } from '../config/database';
import { WarehouseSchema, IWarehouse } from '../models/warehouse.model';
import { BadRequestError, NotFoundError } from '../utils/appError';

export interface CreateWarehousePayload {
  storeId: string;
  name: string;
  code: string;
  description?: string;
  zones?: Array<{
    name: string;
    code: string;
    type: 'receiving' | 'storage' | 'picking' | 'staging';
    description?: string;
  }>;
  bins?: Array<{
    code: string;
    zoneCode: string;
    capacity?: number;
    allowOversize?: boolean;
  }>;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface WarehouseFilters {
  storeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class WarehouseService {
  private async getModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IWarehouse>('Warehouse', WarehouseSchema);
  }

  private ensureZoneCodesUnique(zones?: CreateWarehousePayload['zones']) {
    if (!zones) return;
    const codes = zones.map((zone) => zone.code.toLowerCase());
    const unique = new Set(codes);
    if (codes.length !== unique.size) {
      throw new BadRequestError('Zone codes must be unique');
    }
  }

  async listWarehouses(tenantId: string, filters: WarehouseFilters = {}): Promise<{
    records: IWarehouse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const Warehouse = await this.getModel(tenantId);
    const query: Record<string, unknown> = { tenantId };
    if (filters.storeId) {
      query.store = filters.storeId;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(filters.limit ?? 50, 200);
    const page = Math.max(filters.page ?? 1, 1);

    const [records, total] = await Promise.all([
      Warehouse.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Warehouse.countDocuments(query),
    ]);

    return {
      records: records as IWarehouse[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWarehouseById(tenantId: string, id: string): Promise<IWarehouse> {
    const Warehouse = await this.getModel(tenantId);
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }
    return warehouse;
  }

  async createWarehouse(tenantId: string, payload: CreateWarehousePayload): Promise<IWarehouse> {
    this.ensureZoneCodesUnique(payload.zones);

    const Warehouse = await this.getModel(tenantId);
    const warehouse = new Warehouse({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      store: new mongoose.Types.ObjectId(payload.storeId),
      name: payload.name,
      code: payload.code,
      description: payload.description,
      zones: payload.zones || [],
      bins: payload.bins || [],
      tasks: [],
    });

    await warehouse.save();
    return warehouse;
  }

  async updateWarehouse(
    tenantId: string,
    id: string,
    payload: UpdateWarehousePayload
  ): Promise<IWarehouse> {
    const warehouse = await this.getWarehouseById(tenantId, id);
    if (payload.zones) {
      this.ensureZoneCodesUnique(payload.zones);
      warehouse.zones = payload.zones;
    }
    if (payload.bins) warehouse.bins = payload.bins;
    if (payload.name) warehouse.name = payload.name;
    if (payload.code) warehouse.code = payload.code;
    if (payload.description !== undefined) warehouse.description = payload.description;
    if (payload.storeId) warehouse.store = new mongoose.Types.ObjectId(payload.storeId);
    await warehouse.save();
    return warehouse;
  }

  async deleteWarehouse(tenantId: string, id: string): Promise<void> {
    const Warehouse = await this.getModel(tenantId);
    const result = await Warehouse.deleteOne({ _id: id, tenantId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Warehouse not found');
    }
  }
}

export const warehouseService = new WarehouseService();

