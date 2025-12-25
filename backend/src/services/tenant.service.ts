import { Types } from 'mongoose';
import {
  getMasterConnection,
  getTenantConnection,
  initializeTenantDatabase,
} from '../config/database';
import { TenantSchema, ITenant } from '../models/tenant.model';
import { UserSchema } from '../models/user.model';
import { StoreSchema } from '../models/store.model';
import { ProductSchema } from '../models/product.model';
import { SaleSchema } from '../models/sale.model';
import { SyncDeviceSchema } from '../models/syncDevice.model';
import { generateSlug } from '../utils/validators';
import { AppError, ConflictError, NotFoundError } from '../utils/appError';
import { UserRole, SubscriptionPlan, SubscriptionStatus, TenantStatus } from '../types';
import { logger } from '../utils/logger';
import { seedTenantSampleData } from '../seeds/sampleData';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const { ObjectId } = Types;

const pct = (used: number, limit: number) => {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, parseFloat(((used / limit) * 100).toFixed(2)));
};

export class TenantService {
  private async getTenantModel() {
    const masterConn = await getMasterConnection();
    return masterConn.models.Tenant || masterConn.model<ITenant>('Tenant', TenantSchema);
  }

  private async getUserModel() {
    const masterConn = await getMasterConnection();
    return masterConn.models.User || masterConn.model('User', UserSchema);
  }

  private async ensureTenant(tenantId: string): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    return tenant;
  }

  /**
   * Register a new tenant
   */
  async register(data: {
    name: string;
    subdomain: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ tenant: ITenant; user: { id: string; email: string; firstName: string; lastName: string; role: string }; accessToken: string; refreshToken: string }> {
    const Tenant = await this.getTenantModel();
    const User = await this.getUserModel();

    // Validate uniqueness
    const [existingTenant, existingUser] = await Promise.all([
      Tenant.findOne({ subdomain: data.subdomain }),
      User.findOne({ email: data.email }),
    ]);

    if (existingTenant) {
      throw new ConflictError('Subdomain already taken');
    }

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    let tenant;
    let user;
    let tenantConn;

    try {
      const dbName = `tenant_${data.subdomain}_${Date.now()}`;
      const slug = generateSlug(data.name);

      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate.getTime());
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      // Step 1: Create tenant
      tenant = await Tenant.create({
        name: data.name,
        slug,
        subdomain: data.subdomain,
        dbName,
        owner: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
        },
        subscription: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.TRIAL,
          trialStartDate,
          trialEndDate,
          billingCycle: 'monthly',
        },
        status: TenantStatus.ACTIVE,
      });

      logger.info(`Tenant created: ${tenant.subdomain} (${tenant.dbName})`);

      // Step 2: Initialize tenant database BEFORE creating user
      tenantConn = await getTenantConnection(tenant._id.toString(), tenant.dbName);
      await initializeTenantDatabase(tenantConn, tenant._id.toString());

      // Step 3: Create user
      user = await User.create({
        tenantId: tenant._id,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.OWNER,
        permissions: ['*'],
        emailVerified: false,
        status: 'active',
      });

      logger.info(`User created: ${user.email} for tenant ${tenant.subdomain}`);

      // Step 4: Seed sample data
      await seedTenantSampleData(tenantConn, {
        tenantId: tenant._id.toString(),
        userId: user._id.toString(),
      });

      // Step 5: Update tenant usage
      await Tenant.updateOne(
        { _id: tenant._id },
        { $inc: { 'usage.users': 1, 'usage.stores': 1 } }
      );

      // Step 6: Generate tokens
      const tokenPayload = {
        id: user._id.toString(),
        tenantId: tenant._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      logger.info(`Tenant registration completed: ${tenant.subdomain}`);

      return {
        tenant,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error: unknown) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : {
        message: 'Unknown error',
        stack: undefined,
        name: 'UnknownError',
      };

      logger.error(
        `Failed to register tenant ${data.subdomain || data.name}:`,
        errorDetails
      );

      // Rollback: Delete user if created
      if (user) {
        try {
          await User.deleteOne({ _id: user._id });
          logger.info(`Rolled back: Deleted user ${user.email}`);
        } catch (deleteUserError: unknown) {
          const userErrorDetails = deleteUserError instanceof Error ? {
            message: deleteUserError.message,
            userId: user._id,
          } : {
            message: 'Unknown error deleting user',
            userId: user._id,
          };
          logger.error('Failed to delete user after rollback:', userErrorDetails);
        }
      }

      // Rollback: Delete tenant if created
      if (tenant) {
        try {
          await Tenant.deleteOne({ _id: tenant._id });
          logger.info(`Rolled back: Deleted tenant ${tenant.subdomain}`);
        } catch (deleteTenantError: unknown) {
          const tenantErrorDetails = deleteTenantError instanceof Error ? {
            message: deleteTenantError.message,
            tenantId: tenant._id,
          } : {
            message: 'Unknown error deleting tenant',
            tenantId: tenant._id,
          };
          logger.error('Failed to delete tenant after rollback:', tenantErrorDetails);
        }
      }

      // Rollback: Drop tenant database if created
      if (tenant && tenant.dbName) {
        try {
          const tenantConnRollback = await getTenantConnection(
            tenant._id.toString(),
            tenant.dbName
          );
          await tenantConnRollback.db.dropDatabase();
          logger.info(`Rolled back: Dropped tenant database ${tenant.dbName}`);
        } catch (dropError: unknown) {
          const dropErrorDetails = dropError instanceof Error ? {
            message: dropError.message,
            dbName: tenant.dbName,
          } : {
            message: 'Unknown error dropping database',
            dbName: tenant.dbName,
          };
          logger.error('Failed to drop tenant database after rollback:', dropErrorDetails);
        }
      }

      // Re-throw the original error, preserving its type if it's an AppError
      if (error instanceof AppError) {
        throw error;
      }

      // For other errors, wrap with better context but preserve message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during tenant registration';
      const wrappedError = new Error(`Tenant registration failed: ${errorMessage}`);
      (wrappedError as { originalError: unknown }).originalError = error;
      throw wrappedError;
    }
  }

  async getBySubdomain(subdomain: string): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findOne({ subdomain });
    if (!tenant) {
      throw new NotFoundError('Tenant');
    }
    return tenant;
  }

  async getById(tenantId: string): Promise<ITenant> {
    return this.ensureTenant(tenantId);
  }

  async update(tenantId: string, data: Partial<ITenant>): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    logger.info(`Tenant updated: ${tenant.subdomain}`);
    return tenant;
  }

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    const Tenant = await this.getTenantModel();
    const existing = await Tenant.findOne({ subdomain });
    return !existing;
  }

  async getUsage(tenantId: string): Promise<{
    tenant: {
      id: string;
      name: string;
      status: string;
      plan: string;
      billingCycle: string;
      suspendedAt?: Date;
      suspendReason?: string;
      features: {
        multiStore: boolean;
        restaurant: boolean;
        inventory: boolean;
        loyalty: boolean;
        reporting: boolean;
        api: boolean;
        webhooks: boolean;
      };
    };
    limits: {
      users: number;
      stores: number;
      products: number;
      monthlyTransactions: number;
      storageBytes: number;
    };
    usage: {
      seats: {
        used: number;
        limit: number;
        percent: number;
        byRole: Array<{ role: string; count: number }>;
      };
      stores: {
        used: number;
        active: number;
        inactive: number;
        limit: number;
        percent: number;
      };
      products: {
        used: number;
        limit: number;
        percent: number;
      };
      monthlyTransactions: {
        count: number;
        totalAmount: number;
        totalTax: number;
        limit: number;
        percent: number;
        periodStart: Date;
      };
      storage: {
        usedBytes: number;
        limitBytes: number;
        percent: number;
      };
    };
    sync: {
      deviceCount: number;
      online: number;
      offline: number;
      degraded: number;
      conflicts: number;
      latestSyncAt?: Date;
      devices: Array<{
        id: string;
        label: string;
        status: string;
        lastSyncAt?: Date;
        lastSeenAt?: Date;
        queueSize: number;
        conflicts: number;
        appVersion: string;
        platform: string;
      }>;
    };
    updatedAt: Date;
  }> {
    const tenant = await this.ensureTenant(tenantId);

    const tenantConn = await getTenantConnection(tenantId, tenant.dbName);
    const User = tenantConn.model('User');
    const Store = tenantConn.model('Store', StoreSchema);
    const Product = tenantConn.model('Product', ProductSchema);
    const Sale = tenantConn.model('Sale', SaleSchema);
    const SyncDevice = tenantConn.model('SyncDevice', SyncDeviceSchema);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [
      usersByRole,
      storeSummary,
      productCount,
      salesAggregate,
      conflictCount,
      devices,
      dbStats,
    ] = await Promise.all([
      User.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Store.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$isActive', count: { $sum: 1 } } },
      ]),
      Product.countDocuments(),
      Sale.aggregate<{ count: number; totalAmount: number; totalTax: number }>([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            totalTax: { $sum: '$tax' },
          },
        },
      ]),
      Sale.countDocuments({ syncStatus: 'conflict' }),
      SyncDevice.find().lean(),
      tenantConn.db.command({ dbStats: 1, scale: 1 }).catch(() => ({ storageSize: 0 })),
    ]);

    const totalUsers = usersByRole.reduce((sum, item) => sum + item.count, 0);
    const storeCounts = storeSummary.reduce(
      (acc, item) => {
        if (item._id === true) acc.active += item.count;
        else acc.inactive += item.count;
        return acc;
      },
      { active: 0, inactive: 0 }
    );

    const salesStats = salesAggregate[0] || {
      count: 0,
      totalAmount: 0,
      totalTax: 0,
    };

    const storageBytesUsed = Math.round(dbStats?.storageSize ?? 0);
    const latestSyncAt = devices.reduce<Date | undefined>((latest, device) => {
      const last = device.lastSyncAt || device.lastSeenAt;
      if (!last) return latest;
      const lastDate = new Date(last);
      if (!latest || lastDate > latest) {
        return lastDate;
      }
      return latest;
    }, undefined);

    return {
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        status: tenant.status,
        plan: tenant.subscription.plan,
        billingCycle: tenant.subscription.billingCycle,
        suspendedAt: tenant.suspendedAt,
        suspendReason: tenant.suspendReason,
        features: tenant.features,
      },
      limits: tenant.limits,
      usage: {
        seats: {
          used: totalUsers,
          limit: tenant.limits.users,
          percent: pct(totalUsers, tenant.limits.users),
          byRole: usersByRole.map((role) => ({
            role: role._id,
            count: role.count,
          })),
        },
        stores: {
          used: storeCounts.active + storeCounts.inactive,
          active: storeCounts.active,
          inactive: storeCounts.inactive,
          limit: tenant.limits.stores,
          percent: pct(storeCounts.active + storeCounts.inactive, tenant.limits.stores),
        },
        products: {
          used: productCount,
          limit: tenant.limits.products,
          percent: pct(productCount, tenant.limits.products),
        },
        monthlyTransactions: {
          count: salesStats.count,
          totalAmount: salesStats.totalAmount,
          totalTax: salesStats.totalTax,
          limit: tenant.limits.monthlyTransactions,
          percent: pct(salesStats.count, tenant.limits.monthlyTransactions),
          periodStart: startOfMonth,
        },
        storage: {
          usedBytes: storageBytesUsed,
          limitBytes: tenant.limits.storageBytes,
          percent: pct(storageBytesUsed, tenant.limits.storageBytes),
        },
      },
      sync: {
        deviceCount: devices.length,
        online: devices.filter((d) => d.status === 'online').length,
        offline: devices.filter((d) => d.status === 'offline').length,
        degraded: devices.filter((d) => d.status === 'degraded').length,
        conflicts: conflictCount,
        latestSyncAt,
        devices: devices.map((device) => ({
          id: device.deviceId,
          label: device.label,
          status: device.status,
          lastSyncAt: device.lastSyncAt,
          lastSeenAt: device.lastSeenAt,
          queueSize: device.queueSize,
          conflicts: device.conflicts,
          appVersion: device.appVersion,
          platform: device.platform,
        })),
      },
      updatedAt: new Date(),
    };
  }

  async updateLimits(
    tenantId: string,
    limits: Partial<ITenant['limits']>
  ): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    tenant.limits = {
      ...tenant.limits,
      ...limits,
    };

    tenant.markModified('limits');
    await tenant.save();

    return tenant;
  }

  async updatePlan(
    tenantId: string,
    data: {
      plan?: SubscriptionPlan;
      billingCycle?: 'monthly' | 'yearly';
      status?: SubscriptionStatus;
      features?: Partial<ITenant['features']>;
    }
  ): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    if (data.plan) {
      tenant.subscription.plan = data.plan;
    }

    if (data.billingCycle) {
      tenant.subscription.billingCycle = data.billingCycle;
    }

    if (data.status) {
      tenant.subscription.status = data.status;
    }

    if (data.features) {
      tenant.features = { ...tenant.features, ...data.features };
    }

    tenant.markModified('subscription');
    tenant.markModified('features');
    await tenant.save();

    return tenant;
  }

  async suspend(
    tenantId: string,
    options: { reason?: string; suspendedBy?: string; effectiveAt?: Date } = {}
  ): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    tenant.status = TenantStatus.SUSPENDED;
    tenant.suspendedAt = options.effectiveAt || new Date();
    tenant.suspendReason = options.reason;
    tenant.suspendedBy =
      options.suspendedBy && ObjectId.isValid(options.suspendedBy)
        ? new ObjectId(options.suspendedBy)
        : undefined;
    tenant.reactivatedAt = undefined;

    await tenant.save();

    return tenant;
  }

  async activate(
    tenantId: string,
    _options: { reactivatedBy?: string } = {}
  ): Promise<ITenant> {
    const Tenant = await this.getTenantModel();
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    tenant.status = TenantStatus.ACTIVE;
    tenant.reactivatedAt = new Date();
    tenant.suspendedAt = undefined;
    tenant.suspendReason = undefined;
    tenant.suspendedBy = undefined;

    await tenant.save();

    return tenant;
  }
}

export const tenantService = new TenantService();
