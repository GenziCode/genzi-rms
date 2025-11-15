/**
 * RBAC System Tests
 * Comprehensive test suite for Role-Based Access Control
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { getMasterConnection } from '../../config/database';
import { RoleSchema } from '../../models/role.model';
import { PermissionSchema } from '../../models/permission.model';
import { RoleAssignmentSchema } from '../../models/roleAssignment.model';
import { permissionService } from '../../services/permission.service';
import { roleService } from '../../services/role.service';

describe('RBAC System', () => {
  let connection: mongoose.Connection;
  let testTenantId: mongoose.Types.ObjectId;
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    connection = await getMasterConnection();
    testTenantId = new mongoose.Types.ObjectId();
    testUserId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    // Cleanup test data
    const Role = connection.model('Role', RoleSchema);
    connection.model('Permission', PermissionSchema);
    const RoleAssignment = connection.model('RoleAssignment', RoleAssignmentSchema);
    
    await Role.deleteMany({ tenantId: testTenantId });
    await RoleAssignment.deleteMany({ tenantId: testTenantId });
    
    await connection.close();
  });

  describe('Permission Service', () => {
    it('should get all permissions', async () => {
      const permissions = await permissionService.getAllPermissions();
      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should get permissions by module', async () => {
      const permissions = await permissionService.getPermissionsByModule('product');
      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should check permission with wildcard', () => {
      const hasPermission = permissionService.hasPermission(['*'], 'product:create');
      expect(hasPermission).toBe(true);
    });

    it('should check permission without wildcard', () => {
      const hasPermission = permissionService.hasPermission(['product:create'], 'product:create');
      expect(hasPermission).toBe(true);
    });

    it('should deny permission when not present', () => {
      const hasPermission = permissionService.hasPermission(['product:read'], 'product:create');
      expect(hasPermission).toBe(false);
    });
  });

  describe('Role Service', () => {
    let testRoleId: string;

    it('should create a role', async () => {
      const role = await roleService.createRole(testTenantId.toString(), {
        name: 'Test Role',
        code: 'TEST_ROLE',
        description: 'Test role for unit testing',
        category: 'custom',
        permissionCodes: ['product:read', 'product:create'],
        scope: { type: 'all' },
      });

      expect(role).toBeDefined();
      expect(role.name).toBe('Test Role');
      expect(role.code).toBe('TEST_ROLE');
      testRoleId = (role._id as mongoose.Types.ObjectId).toString();
    });

    it('should get role by ID', async () => {
      const role = await roleService.getRoleById(testTenantId.toString(), testRoleId);
      expect(role).toBeDefined();
      expect((role._id as mongoose.Types.ObjectId).toString()).toBe(testRoleId);
    });

    it('should update role', async () => {
      const updated = await roleService.updateRole(testTenantId.toString(), testRoleId, {
        name: 'Updated Test Role',
        permissionCodes: ['product:read', 'product:create', 'product:update'],
      });

      expect(updated.name).toBe('Updated Test Role');
      expect(updated.permissions.length).toBe(3);
    });

    it('should assign role to user', async () => {
      const assignment = await roleService.assignRoleToUser(
        testTenantId.toString(),
        testUserId.toString(),
        testRoleId,
        testUserId.toString()
      );

      expect(assignment).toBeDefined();
      expect(assignment.userId.toString()).toBe(testUserId.toString());
      expect(assignment.roleId.toString()).toBe(testRoleId);
    });

    it('should get user roles', async () => {
      const roles = await roleService.getUserRoles(
        testTenantId.toString(),
        testUserId.toString()
      );

      expect(roles).toBeDefined();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should get user permissions', async () => {
      const permissions = await roleService.getUserPermissions(
        testTenantId.toString(),
        testUserId.toString()
      );

      expect(permissions).toBeDefined();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should delete role', async () => {
      // Remove role assignment first
      await roleService.removeRoleFromUser(
        testTenantId.toString(),
        testUserId.toString(),
        testRoleId
      );

      await roleService.deleteRole(testTenantId.toString(), testRoleId);
      
      // Verify deletion
      await expect(
        roleService.getRoleById(testTenantId.toString(), testRoleId)
      ).rejects.toThrow();
    });
  });
});

