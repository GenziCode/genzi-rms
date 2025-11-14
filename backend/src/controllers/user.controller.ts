import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { roleService } from '../services/role.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Create user/employee
   * POST /api/users
   */
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const creatorId = req.user!.id;

      // Only owner and admin can create users
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to create users', 403);
      }

      const user = await this.userService.createUser(tenantId, creatorId, req.body);

      res.status(201).json(successResponse(user, 'User created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all users
   * GET /api/users
   */
  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { role, status, search, page, limit } = req.query;

      const result = await this.userService.getUsers(tenantId, {
        role: role as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result, 'Users retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      res.json(successResponse(user, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updaterId = req.user!.id;

      // Only owner, admin, or the user themselves can update
      if (!['owner', 'admin'].includes(req.user!.role) && req.user!.id !== id) {
        throw new AppError('Insufficient permissions to update this user', 403);
      }

      const user = await this.userService.updateUser(id, updaterId, req.body);

      res.json(successResponse(user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user role
   * PUT /api/users/:id/role
   */
  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updaterId = req.user!.id;
      const { role, permissions } = req.body;

      // Only owner and admin can change roles
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to change user roles', 403);
      }

      const user = await this.userService.updateUserRole(id, updaterId, role, permissions);

      res.json(successResponse(user, 'User role updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user (deactivate)
   * DELETE /api/users/:id
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleterId = req.user!.id;

      // Only owner and admin can delete users
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to delete users', 403);
      }

      // Prevent self-deletion
      if (deleterId === id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      await this.userService.deleteUser(id, deleterId);

      res.json(successResponse(null, 'User deactivated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset user password
   * POST /api/users/:id/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      // Only owner and admin can reset passwords
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to reset passwords', 403);
      }

      if (!newPassword || newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
      }

      await this.userService.resetPassword(id, newPassword);

      res.json(successResponse(null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user roles
   * GET /api/users/:id/roles
   */
  getUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { id } = req.params;

      // Only owner, admin, or the user themselves can view roles
      if (!['owner', 'admin'].includes(req.user!.role) && req.user!.id !== id) {
        throw new AppError('Insufficient permissions to view user roles', 403);
      }

      const roles = await roleService.getUserRoles(tenantId, id);
      res.json(successResponse({ roles }, 'User roles retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign role to user
   * POST /api/users/:id/roles
   */
  assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, id: assignedBy } = req.user!;
      const { id: userId } = req.params;
      const { roleId, expiresAt, scopeOverride } = req.body;

      // Only owner and admin can assign roles
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to assign roles', 403);
      }

      const assignment = await roleService.assignRoleToUser(
        tenantId,
        userId,
        roleId,
        assignedBy,
        expiresAt ? new Date(expiresAt) : undefined,
        scopeOverride
      );

      res.json(successResponse({ assignment }, 'Role assigned successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove role from user
   * DELETE /api/users/:id/roles/:roleId
   */
  removeRoleFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { id: userId, roleId } = req.params;

      // Only owner and admin can remove roles
      if (!['owner', 'admin'].includes(req.user!.role)) {
        throw new AppError('Insufficient permissions to remove roles', 403);
      }

      await roleService.removeRoleFromUser(tenantId, userId, roleId);
      res.json(successResponse(null, 'Role removed successfully'));
    } catch (error) {
      next(error);
    }
  };
}
