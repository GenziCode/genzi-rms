import { getMasterConnection } from '../config/database';
import { UserSchema, IUser } from '../models/user.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class UserService {
  private async getUserModel() {
    const connection = await getMasterConnection();
    return connection.model<IUser>('User', UserSchema);
  }

  /**
   * Create user/employee
   */
  async createUser(
    tenantId: string,
    creatorId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
      permissions?: string[];
      phone?: string;
    }
  ): Promise<IUser> {
    try {
      const User = await this.getUserModel();

      // Check if email already exists
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        throw new AppError('Email already exists', 409);
      }

      // Validate role
      const validRoles = ['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'];
      if (!validRoles.includes(data.role)) {
        throw new AppError('Invalid role', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = new User({
        tenantId,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        permissions: data.permissions || this.getDefaultPermissions(data.role),
        phone: data.phone,
      });

      await user.save();

      logger.info(`User created: ${user.email} (${user.role})`);

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      return userObj as IUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get default permissions by role
   */
  private getDefaultPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      owner: ['*'], // All permissions
      admin: ['users:read', 'users:write', 'products:*', 'sales:*', 'inventory:*', 'reports:*'],
      manager: [
        'products:read',
        'sales:*',
        'inventory:read',
        'inventory:adjust',
        'reports:read',
        'customers:*',
      ],
      cashier: [
        'products:read',
        'sales:create',
        'sales:read',
        'customers:read',
        'customers:create',
      ],
      kitchen_staff: ['products:read', 'sales:read'],
      waiter: ['products:read', 'sales:create', 'sales:read', 'customers:read'],
    };

    return rolePermissions[role] || [];
  }

  /**
   * Get all users for a tenant
   */
  async getUsers(
    tenantId: string,
    options: {
      role?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const User = await this.getUserModel();

      const { role, status = 'active', search, page = 1, limit = 50 } = options;

      const query: any = { tenantId };

      if (role) query.role = role;
      if (status) query.status = status;

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(query);

      const users = await User.find(query)
        .select('-password') // Exclude password
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    try {
      const User = await this.getUserModel();

      const user = await User.findById(userId).select('-password');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updaterId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
      status?: string;
    }
  ): Promise<IUser> {
    try {
      const User = await this.getUserModel();

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update allowed fields
      if (data.firstName) user.firstName = data.firstName;
      if (data.lastName) user.lastName = data.lastName;
      if (data.phone !== undefined) user.phone = data.phone;
      if (data.avatar !== undefined) user.avatar = data.avatar;
      if (data.status) user.status = data.status;

      await user.save();

      logger.info(`User updated: ${user.email}`);

      const userObj = user.toObject();
      delete userObj.password;
      return userObj as IUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user role and permissions
   */
  async updateUserRole(
    userId: string,
    updaterId: string,
    role: string,
    permissions?: string[]
  ): Promise<IUser> {
    try {
      const User = await this.getUserModel();

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prevent changing owner role
      if (user.role === 'owner') {
        throw new AppError('Cannot change owner role', 403);
      }

      const validRoles = ['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'];
      if (!validRoles.includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      user.role = role;
      user.permissions = permissions || this.getDefaultPermissions(role);

      await user.save();

      logger.info(`User role updated: ${user.email} → ${role}`);

      const userObj = user.toObject();
      delete userObj.password;
      return userObj as IUser;
    } catch (error) {
      logger.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Delete user (deactivate)
   */
  async deleteUser(userId: string, _deleterId: string): Promise<void> {
    try {
      const User = await this.getUserModel();

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Prevent deleting owner
      if (user.role === 'owner') {
        throw new AppError('Cannot delete owner account', 403);
      }

      // Soft delete
      user.status = 'inactive';
      await user.save();

      logger.info(`User deactivated: ${user.email}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const User = await this.getUserModel();

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      await user.save();

      logger.info(`Password reset for user: ${user.email}`);
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }
}
