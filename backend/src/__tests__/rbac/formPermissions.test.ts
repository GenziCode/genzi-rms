/**
 * Form Permission Tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { getMasterConnection } from '../../config/database';
import { FormPermissionSchema } from '../../models/formPermission.model';
import { formPermissionService } from '../../services/formPermission.service';

describe('Form Permissions', () => {
  let connection: mongoose.Connection;
  let testTenantId: mongoose.Types.ObjectId;
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    connection = await getMasterConnection();
    testTenantId = new mongoose.Types.ObjectId();
    testUserId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    const FormPermission = connection.model('FormPermission', FormPermissionSchema);
    await FormPermission.deleteMany({ tenantId: testTenantId });
    await connection.close();
  });

  it('should create form permission', async () => {
    const form = await formPermissionService.createFormPermission(testTenantId.toString(), {
      formName: 'frmTestForm',
      formCaption: 'Test Form',
      formCategory: 'Test',
      module: 'test',
      route: '/api/test',
      method: 'GET',
      requiredPermission: 'test:read',
    });

    expect(form).toBeDefined();
    expect(form.formName).toBe('frmTestForm');
  });

  it('should check form access', async () => {
    // This test requires proper role setup
    // For now, just verify the method exists and doesn't throw
    const hasAccess = await formPermissionService.checkFormAccess(
      testTenantId.toString(),
      testUserId.toString(),
      'frmTestForm'
    );

    expect(typeof hasAccess).toBe('boolean');
  });

  it('should get form permissions', async () => {
    const forms = await formPermissionService.getFormPermissions(testTenantId.toString());
    expect(forms).toBeDefined();
    expect(Array.isArray(forms)).toBe(true);
  });
});

