import { Response } from 'express';
import { TenantRequest } from '../types';
import { reportTemplateService } from '../services/reportTemplate.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Report Template Controller
 * Handles report template CRUD operations
 */
export class ReportTemplateController {
  /**
   * Create a new report template
   * POST /api/report-templates
   */
  createTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const template = await reportTemplateService.createTemplate(tenantId, req.body, userId);
    res.status(201).json(successResponse(template, 'Report template created successfully'));
  });

  /**
   * Get all templates for tenant
   * GET /api/report-templates
   */
  getTemplates = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { category, module, isActive, isSystemTemplate } = req.query;

    const filters: any = {};
    if (category) filters.category = category;
    if (module) filters.module = module;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isSystemTemplate !== undefined) filters.isSystemTemplate = isSystemTemplate === 'true';

    const templates = await reportTemplateService.getTemplates(tenantId, filters);
    res.json(successResponse(templates, 'Templates retrieved successfully'));
  });

  /**
   * Get template by ID
   * GET /api/report-templates/:id
   */
  getTemplateById = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const template = await reportTemplateService.getTemplateById(tenantId, id);
    res.json(successResponse(template, 'Template retrieved successfully'));
  });

  /**
   * Update template
   * PUT /api/report-templates/:id
   */
  updateTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;
    const template = await reportTemplateService.updateTemplate(tenantId, id, req.body, userId);
    res.json(successResponse(template, 'Template updated successfully'));
  });

  /**
   * Delete template
   * DELETE /api/report-templates/:id
   */
  deleteTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    await reportTemplateService.deleteTemplate(tenantId, id);
    res.json(successResponse(null, 'Template deleted successfully'));
  });

  /**
   * Clone template
   * POST /api/report-templates/:id/clone
   */
  cloneTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Template name is required for cloning' },
      });
    }

    const clonedTemplate = await reportTemplateService.cloneTemplate(tenantId, id, name, userId);
    res.status(201).json(successResponse(clonedTemplate, 'Template cloned successfully'));
  });

  /**
   * Get template versions
   * GET /api/report-templates/:id/versions
   */
  getTemplateVersions = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const versions = await reportTemplateService.getTemplateVersions(tenantId, id);
    res.json(successResponse(versions, 'Template versions retrieved successfully'));
  });

  /**
   * Get specific template version
   * GET /api/report-templates/:id/versions/:version
   */
  getTemplateVersion = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id, version } = req.params;
    const versionNumber = parseInt(version, 10);
    
    if (isNaN(versionNumber)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid version number' },
      });
    }

    const versionData = await reportTemplateService.getTemplateVersion(tenantId, id, versionNumber);
    res.json(successResponse(versionData, 'Template version retrieved successfully'));
  });

  /**
   * Rollback template to a specific version
   * POST /api/report-templates/:id/rollback
   */
  rollbackTemplate = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const { id: userId } = req.user!;
    const { version } = req.body;

    if (!version || typeof version !== 'number') {
      return res.status(400).json({
        success: false,
        error: { message: 'Version number is required' },
      });
    }

    const template = await reportTemplateService.rollbackTemplate(tenantId, id, version, userId);
    res.json(successResponse(template, `Template rolled back to version ${version} successfully`));
  });

  /**
   * Compare two template versions
   * GET /api/report-templates/:id/compare/:version1/:version2
   */
  compareVersions = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id, version1, version2 } = req.params;
    const v1 = parseInt(version1, 10);
    const v2 = parseInt(version2, 10);

    if (isNaN(v1) || isNaN(v2)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid version numbers' },
      });
    }

    const comparison = await reportTemplateService.compareVersions(tenantId, id, v1, v2);
    res.json(successResponse(comparison, 'Version comparison retrieved successfully'));
  });
}

export const reportTemplateController = new ReportTemplateController();

