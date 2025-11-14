import mongoose from 'mongoose';
import { getMasterConnection } from '../config/database';
import { RoleSchema, IRole } from '../models/role.model';
import { RoleAssignmentSchema, IRoleAssignment } from '../models/roleAssignment.model';
import { UserSchema } from '../models/user.model';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';
import { permissionService } from './permission.service';

/**
 * Role Service
 * Manages roles and role assignments
 */
export class RoleService {
  /**
   * Get Role model
   */
  private async getRoleModel(tenantId: string) {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.Role ||
      masterConn.model<IRole>('Role', RoleSchema)
    );
  }

  /**
   * Get RoleAssignment model
   */
  private async getRoleAssignmentModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.RoleAssignment ||
      masterConn.model<IRoleAssignment>('RoleAssignment', RoleAssignmentSchema)
    );
  }

  /**
   * Get User model
   */
  private async getUserModel() {
    const masterConn = await getMasterConnection();
    return masterConn.models.User || masterConn.model('User', UserSchema);
  }

  /**
   * Create a role for a tenant
   * @param tenantId - Tenant ID
   * @param data - Role data
   */
  async createRole(
    tenantId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      category?: 'system' | 'custom';
      parentRoleId?: string;
      permissionCodes?: string[];
      scope?: {
        type: 'all' | 'store' | 'department' | 'custom';
        storeIds?: string[];
        departmentIds?: string[];
        customFilters?: any;
      };
    }
  ): Promise<IRole> {
    const Role = await this.getRoleModel(tenantId);

    // Check if role with same code already exists for this tenant
    const existing = await Role.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      code: data.code.toLowerCase(),
    });

    if (existing) {
      throw new ConflictError(`Role with code '${data.code}' already exists`);
    }

    // Get permission IDs
    let permissionIds: mongoose.Types.ObjectId[] = [];
    if (data.permissionCodes && data.permissionCodes.length > 0) {
      const allPermissions = await permissionService.getAllPermissions();
      const permissionMap = new Map<string, mongoose.Types.ObjectId>();
      allPermissions.forEach(perm => {
        permissionMap.set(perm.code, perm._id as mongoose.Types.ObjectId);
      });

      for (const permCode of data.permissionCodes) {
        if (permCode === '*') {
          // All permissions
          permissionIds = Array.from(permissionMap.values());
          break;
        } else if (permCode.endsWith(':*')) {
          // Module wildcard (e.g., 'product:*')
          const module = permCode.replace(':*', '');
          allPermissions
            .filter(p => p.module === module)
            .forEach(p => {
              const id = permissionMap.get(p.code);
              if (id) permissionIds.push(id);
            });
        } else {
          // Specific permission
          const id = permissionMap.get(permCode.toLowerCase());
          if (id) permissionIds.push(id);
        }
      }

      // Remove duplicates
      permissionIds = Array.from(
        new Set(permissionIds.map(id => id.toString()))
      ).map(id => new mongoose.Types.ObjectId(id));
    }

    // Create role
    const role = await Role.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: data.name,
      code: data.code.toLowerCase(),
      description: data.description,
      category: data.category || 'custom',
      parentRole: data.parentRoleId
        ? new mongoose.Types.ObjectId(data.parentRoleId)
        : undefined,
      permissions: permissionIds,
      scope: data.scope || { type: 'all' },
      isSystemRole: data.category === 'system',
      isActive: true,
    });

    logger.info(`Created role: ${role.code} for tenant: ${tenantId}`);
    return role;
  }

  /**
   * Get role by ID
   * @param tenantId - Tenant ID
   * @param roleId - Role ID
   */
  async getRoleById(tenantId: string, roleId: string): Promise<IRole> {
    const Role = await this.getRoleModel(tenantId);
    const role = await Role.findOne({
      _id: new mongoose.Types.ObjectId(roleId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    }).populate('permissions');

    if (!role) {
      throw new NotFoundError('Role');
    }

    return role;
  }

  /**
   * Get role by code
   * @param tenantId - Tenant ID
   * @param code - Role code
   */
  async getRoleByCode(tenantId: string, code: string): Promise<IRole | null> {
    const Role = await this.getRoleModel(tenantId);
    return Role.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      code: code.toLowerCase(),
      isActive: true,
    }).populate('permissions');
  }

  /**
   * Get all roles for a tenant
   * @param tenantId - Tenant ID
   * @param includeInactive - Include inactive roles (default: false)
   */
  async getRoles(
    tenantId: string,
    includeInactive: boolean = false
  ): Promise<IRole[]> {
    const Role = await this.getRoleModel(tenantId);
    const query: any = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (!includeInactive) {
      query.isActive = true;
    }

    return Role.find(query)
      .populate('permissions')
      .populate('parentRole')
      .sort({ category: 1, name: 1 });
  }

  /**
   * Update role
   * @param tenantId - Tenant ID
   * @param roleId - Role ID
   * @param updates - Role updates
   */
  async updateRole(
    tenantId: string,
    roleId: string,
    updates: {
      name?: string;
      description?: string;
      permissionCodes?: string[];
      scope?: {
        type: 'all' | 'store' | 'department' | 'custom';
        storeIds?: string[];
        departmentIds?: string[];
        customFilters?: any;
      };
      isActive?: boolean;
    }
  ): Promise<IRole> {
    const role = await this.getRoleById(tenantId, roleId);

    // Prevent updating system roles
    if (role.isSystemRole) {
      throw new BadRequestError('Cannot update system roles');
    }

    // Update permission IDs if provided
    if (updates.permissionCodes) {
      const permissions = await Promise.all(
        updates.permissionCodes.map(code => permissionService.getPermissionByCode(code))
      );
      role.permissions = permissions
        .filter(perm => perm !== null)
        .map(perm => perm!._id as mongoose.Types.ObjectId);
    }

    // Update other fields
    if (updates.name) role.name = updates.name;
    if (updates.description !== undefined) role.description = updates.description;
    if (updates.scope) role.scope = updates.scope;
      if (updates.isActive !== undefined) role.isActive = updates.isActive;

    await role.save();

    logger.info(`Updated role: ${role.code} for tenant: ${tenantId}`);
    return role;
  }

  /**
   * Delete role
   * @param tenantId - Tenant ID
   * @param roleId - Role ID
   */
  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    const role = await this.getRoleById(tenantId, roleId);

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw new BadRequestError('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    const RoleAssignment = await this.getRoleAssignmentModel();
    const assignments = await RoleAssignment.countDocuments({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      roleId: new mongoose.Types.ObjectId(roleId),
    });

    if (assignments > 0) {
      throw new ConflictError(
        `Cannot delete role: ${assignments} user(s) are assigned to this role`
      );
    }

    await role.deleteOne();
    logger.info(`Deleted role: ${role.code} for tenant: ${tenantId}`);
  }

  /**
   * Assign role to user
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param roleId - Role ID
   * @param assignedBy - User ID who assigned the role
   * @param expiresAt - Optional expiration date
   * @param scopeOverride - Optional scope override
   */
  async assignRoleToUser(
    tenantId: string,
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date,
    scopeOverride?: {
      type: 'all' | 'store' | 'department' | 'custom';
      storeIds?: string[];
      departmentIds?: string[];
      customFilters?: any;
    }
  ): Promise<IRoleAssignment> {
    // Verify role exists
    await this.getRoleById(tenantId, roleId);

    const RoleAssignment = await this.getRoleAssignmentModel();

    // Check if assignment already exists
    const existing = await RoleAssignment.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      userId: new mongoose.Types.ObjectId(userId),
      roleId: new mongoose.Types.ObjectId(roleId),
    });

    if (existing) {
      // Update existing assignment
      existing.expiresAt = expiresAt;
      existing.scopeOverride = scopeOverride;
      existing.assignedAt = new Date();
      await existing.save();
      logger.info(`Updated role assignment: ${roleId} -> ${userId}`);
      return existing;
    }

    // Create new assignment
    const assignment = await RoleAssignment.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      userId: new mongoose.Types.ObjectId(userId),
      roleId: new mongoose.Types.ObjectId(roleId),
      assignedBy: new mongoose.Types.ObjectId(assignedBy),
      assignedAt: new Date(),
      expiresAt,
      scopeOverride,
    });

    // Update user's roles array
    const User = await this.getUserModel();
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $addToSet: { roles: new mongoose.Types.ObjectId(roleId) } }
    );

    logger.info(`Assigned role: ${roleId} to user: ${userId}`);
    return assignment;
  }

  /**
   * Remove role from user
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param roleId - Role ID
   */
  async removeRoleFromUser(
    tenantId: string,
    userId: string,
    roleId: string
  ): Promise<void> {
    const RoleAssignment = await this.getRoleAssignmentModel();

    // Deactivate assignment (soft delete)
    await RoleAssignment.updateMany(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
        roleId: new mongoose.Types.ObjectId(roleId),
      },
      { $set: { expiresAt: new Date() } } // Set expiration to now
    );

    // Remove from user's roles array
    const User = await this.getUserModel();
    await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $pull: { roles: new mongoose.Types.ObjectId(roleId) } }
    );

    logger.info(`Removed role: ${roleId} from user: ${userId}`);
  }

  /**
   * Get user's roles
   * @param tenantId - Tenant ID
   * @param userId - User ID
   */
  async getUserRoles(tenantId: string, userId: string): Promise<IRole[]> {
    const RoleAssignment = await this.getRoleAssignmentModel();
    const Role = await this.getRoleModel(tenantId);

    // Get active assignments (not expired)
    const assignments = await RoleAssignment.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      userId: new mongoose.Types.ObjectId(userId),
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).populate('roleId');

    const roleIds = assignments
      .map(a => (a.roleId as any)?._id)
      .filter(id => id);

    if (roleIds.length === 0) {
      return [];
    }

    return Role.find({
      _id: { $in: roleIds },
      isActive: true,
    })
      .populate('permissions')
      .populate('parentRole');
  }

  /**
   * Get all permissions for a user (from all their roles)
   * @param tenantId - Tenant ID
   * @param userId - User ID
   */
  async getUserPermissions(tenantId: string, userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(tenantId, userId);
    const permissionSet = new Set<string>();

    roles.forEach(role => {
      // Get permission codes from role
      const permissions = role.permissions as any[];
      permissions.forEach(perm => {
        if (perm && perm.code) {
          permissionSet.add(perm.code);
        }
      });
    });

    return Array.from(permissionSet);
  }

  /**
   * Initialize default system roles for a tenant
   * @param tenantId - Tenant ID
   */
  async initializeDefaultRoles(tenantId: string): Promise<void> {
    const allPermissions = await permissionService.getAllPermissions();
    const permissionMap = new Map<string, mongoose.Types.ObjectId>();
    allPermissions.forEach(perm => {
      permissionMap.set(perm.code, perm._id as mongoose.Types.ObjectId);
    });

    const defaultRoles = [
      {
        code: 'owner',
        name: 'Owner',
        description: 'Full system access, all permissions',
        category: 'system' as const,
        permissionCodes: ['*'], // All permissions
      },
      {
        code: 'admin',
        name: 'Administrator',
        description: 'Administrative access, can manage users and settings',
        category: 'system' as const,
        permissionCodes: [
          'user:*',
          'role:*',
          'tenant:read',
          'tenant:update',
          'settings:*',
          'product:*',
          'customer:*',
          'vendor:*',
          'store:*',
          'category:*',
          'inventory:*',
          'purchaseOrder:*',
          'invoice:*',
          'payment:*',
          'pos:*',
          'report:*',
        ],
      },
      {
        code: 'manager',
        name: 'Manager',
        description: 'Management access, can manage operations',
        category: 'system' as const,
        permissionCodes: [
          'product:*',
          'customer:*',
          'vendor:*',
          'store:read',
          'category:*',
          'inventory:*',
          'purchaseOrder:*',
          'invoice:*',
          'payment:*',
          'pos:*',
          'report:*',
          'user:read',
          'settings:read',
        ],
      },
      {
        code: 'cashier',
        name: 'Cashier',
        description: 'POS and sales access',
        category: 'system' as const,
        permissionCodes: [
          'pos:*',
          'product:read',
          'customer:read',
          'customer:create',
          'invoice:read',
          'invoice:create',
          'invoice:print',
          'payment:create',
          'payment:read',
        ],
      },
      {
        code: 'inventory_clerk',
        name: 'Inventory Clerk',
        description: 'Inventory management access',
        category: 'system' as const,
        permissionCodes: [
          'inventory:*',
          'product:read',
          'product:update',
          'purchaseOrder:read',
          'store:read',
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existing = await this.getRoleByCode(tenantId, roleData.code);
      if (existing) {
        logger.info(`Role ${roleData.code} already exists for tenant ${tenantId}`);
        continue;
      }

      // Get permission IDs
      let permissionIds: mongoose.Types.ObjectId[] = [];
      if (roleData.permissionCodes.includes('*')) {
        // All permissions
        permissionIds = Array.from(permissionMap.values());
      } else {
        // Specific permissions
        for (const permCode of roleData.permissionCodes) {
          if (permCode.endsWith(':*')) {
            // Module wildcard
            const module = permCode.replace(':*', '');
            allPermissions
              .filter(p => p.module === module)
              .forEach(p => {
                const id = permissionMap.get(p.code);
                if (id) permissionIds.push(id);
              });
          } else {
            const id = permissionMap.get(permCode);
            if (id) permissionIds.push(id);
          }
        }
      }

      // Remove duplicates
      permissionIds = Array.from(
        new Set(permissionIds.map(id => id.toString()))
      ).map(id => new mongoose.Types.ObjectId(id));

      // Create role
      await this.createRole(tenantId, {
        ...roleData,
        permissionCodes: roleData.permissionCodes,
      });
    }

    logger.info(`Initialized default roles for tenant: ${tenantId}`);
  }
}

// Export singleton instance
export const roleService = new RoleService();

