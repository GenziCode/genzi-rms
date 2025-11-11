import { getMasterConnection, getTenantConnection, initializeTenantDatabase } from '../config/database';
import { TenantSchema, ITenant } from '../models/tenant.model';
import { UserSchema } from '../models/user.model';
import { generateSlug } from '../utils/validators';
import { ConflictError, NotFoundError } from '../utils/appError';
import { UserRole, SubscriptionPlan, SubscriptionStatus, TenantStatus } from '../types';
import { logger } from '../utils/logger';

export class TenantService {
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
  }): Promise<{ tenant: ITenant; user: any; accessToken: string; refreshToken: string }> {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);
    const User = masterConn.model('User', UserSchema);

    // Check if subdomain already exists
    const existingTenant = await Tenant.findOne({ subdomain: data.subdomain });
    if (existingTenant) {
      throw new ConflictError('Subdomain already taken');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Create tenant database name
    const dbName = `tenant_${data.subdomain}_${Date.now()}`;
    const slug = generateSlug(data.name);

    // Start trial period (14 days)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Create tenant
    const tenant = await Tenant.create({
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

    // Initialize tenant database
    const tenantConn = await getTenantConnection(tenant._id.toString(), tenant.dbName);
    await initializeTenantDatabase(tenantConn);

    // Create owner user
    const user = await User.create({
      tenantId: tenant._id,
      email: data.email,
      password: data.password, // Will be hashed by pre-save hook
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.OWNER,
      permissions: ['*'], // All permissions
      emailVerified: false,
      status: 'active',
    });

    logger.info(`Owner user created: ${user.email} for tenant ${tenant.subdomain}`);

    // Update tenant usage
    await Tenant.updateOne(
      { _id: tenant._id },
      { $inc: { 'usage.users': 1, 'usage.stores': 1 } }
    );

    // Generate tokens
    const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
    const tokenPayload = {
      id: user._id.toString(),
      tenantId: tenant._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

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
  }

  /**
   * Get tenant by subdomain
   */
  async getBySubdomain(subdomain: string): Promise<ITenant> {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const tenant = await Tenant.findOne({ subdomain });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  async getById(tenantId: string): Promise<ITenant> {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(tenantId: string, data: Partial<ITenant>): Promise<ITenant> {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    logger.info(`Tenant updated: ${tenant.subdomain}`);

    return tenant;
  }

  /**
   * Check subdomain availability
   */
  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const existing = await Tenant.findOne({ subdomain });
    return !existing;
  }
}

export const tenantService = new TenantService();

