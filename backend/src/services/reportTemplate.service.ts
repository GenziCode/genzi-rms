import mongoose from 'mongoose';
import { getMasterConnection } from '../config/database';
import { ReportTemplateSchema, IReportTemplate } from '../models/reportTemplate.model';
import { ReportTemplateVersionSchema, IReportTemplateVersion } from '../models/reportTemplateVersion.model';
import { NotFoundError, BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * Report Template Service
 * Manages report template CRUD operations
 */
export class ReportTemplateService {
  /**
   * Get ReportTemplate model
   */
  private async getReportTemplateModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.ReportTemplate ||
      masterConn.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema)
    );
  }

  /**
   * Get ReportTemplateVersion model
   */
  private async getReportTemplateVersionModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.ReportTemplateVersion ||
      masterConn.model<IReportTemplateVersion>('ReportTemplateVersion', ReportTemplateVersionSchema)
    );
  }

  /**
   * Create a new report template
   */
  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      module: string;
      query: any;
      columns: any[];
      filters?: any[];
      grouping?: any;
      sorting?: any;
      format?: any;
      isSystemTemplate?: boolean;
    },
    createdBy: string
  ): Promise<IReportTemplate> {
    const ReportTemplate = await this.getReportTemplateModel();

    // Check if template name already exists for this tenant
    const existing = await ReportTemplate.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: data.name,
    });

    if (existing) {
      throw new BadRequestError(`Template with name '${data.name}' already exists`);
    }

    const template = new ReportTemplate({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      name: data.name,
      description: data.description,
      category: data.category,
      module: data.module,
      query: data.query,
      columns: data.columns,
      filters: data.filters || [],
      grouping: data.grouping || { enabled: false, fields: [] },
      sorting: data.sorting,
      format: {
        showHeader: true,
        showFooter: true,
        showTotals: true,
        pageSize: 50,
        orientation: 'portrait',
        ...data.format,
      },
      isSystemTemplate: data.isSystemTemplate || false,
      isActive: true,
      version: 1,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await template.save();

    // Create initial version history entry
    await this.createVersionHistory(tenantId, template._id.toString(), template, createdBy, 'Initial version');

    logger.info(`Report template created: ${data.name} for tenant ${tenantId}`);

    return template;
  }

  /**
   * Create version history entry
   */
  private async createVersionHistory(
    tenantId: string,
    templateId: string,
    template: IReportTemplate,
    changedBy: string,
    changeDescription?: string
  ): Promise<void> {
    const ReportTemplateVersion = await this.getReportTemplateVersionModel();

    // Mark all previous versions as not current
    await ReportTemplateVersion.updateMany(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        templateId: new mongoose.Types.ObjectId(templateId),
        isCurrentVersion: true,
      },
      {
        $set: { isCurrentVersion: false },
      }
    );

    // Create new version entry
    const versionEntry = new ReportTemplateVersion({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: new mongoose.Types.ObjectId(templateId),
      version: template.version,
      name: template.name,
      description: template.description,
      category: template.category,
      module: template.module,
      query: template.query,
      columns: template.columns,
      filters: template.filters,
      grouping: template.grouping,
      sorting: template.sorting,
      format: template.format,
      changeDescription,
      changedBy: new mongoose.Types.ObjectId(changedBy),
      changedAt: new Date(),
      isCurrentVersion: true,
    });

    await versionEntry.save();
    logger.debug(`Version history created for template ${templateId}, version ${template.version}`);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(tenantId: string, templateId: string): Promise<IReportTemplate> {
    const ReportTemplate = await this.getReportTemplateModel();

    const template = await ReportTemplate.findOne({
      _id: new mongoose.Types.ObjectId(templateId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    if (!template) {
      throw new NotFoundError('Report template not found');
    }

    return template;
  }

  /**
   * Get all templates for a tenant
   */
  async getTemplates(
    tenantId: string,
    filters?: {
      category?: string;
      module?: string;
      isActive?: boolean;
      isSystemTemplate?: boolean;
    }
  ): Promise<IReportTemplate[]> {
    const ReportTemplate = await this.getReportTemplateModel();

    const query: any = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.module) {
      query.module = filters.module.toLowerCase();
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.isSystemTemplate !== undefined) {
      query.isSystemTemplate = filters.isSystemTemplate;
    }

    const templates = await ReportTemplate.find(query).sort({ name: 1 });

    return templates;
  }

  /**
   * Update template
   */
  async updateTemplate(
    tenantId: string,
    templateId: string,
    updates: Partial<IReportTemplate>,
    updatedBy: string
  ): Promise<IReportTemplate> {
    const ReportTemplate = await this.getReportTemplateModel();

    const template = await this.getTemplateById(tenantId, templateId);

    // If name is being updated, check for duplicates
    if (updates.name && updates.name !== template.name) {
      const existing = await ReportTemplate.findOne({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        name: updates.name,
        _id: { $ne: new mongoose.Types.ObjectId(templateId) },
      });

      if (existing) {
        throw new BadRequestError(`Template with name '${updates.name}' already exists`);
      }
    }

    // Increment version on update
    const newVersion = template.version + 1;
    const changeDescription = (updates as any).changeDescription || 'Template updated';

    Object.assign(template, updates, {
      updatedBy: new mongoose.Types.ObjectId(updatedBy),
      version: newVersion,
      updatedAt: new Date(),
    });

    await template.save();

    // Create version history entry
    await this.createVersionHistory(tenantId, templateId, template, updatedBy, changeDescription);

    logger.info(`Report template updated: ${template.name} (v${newVersion})`);

    return template;
  }

  /**
   * Delete template
   */
  async deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    const ReportTemplate = await this.getReportTemplateModel();

    const template = await this.getTemplateById(tenantId, templateId);

    // Don't allow deletion of system templates
    if (template.isSystemTemplate) {
      throw new BadRequestError('Cannot delete system templates');
    }

    await ReportTemplate.deleteOne({
      _id: new mongoose.Types.ObjectId(templateId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    logger.info(`Report template deleted: ${template.name}`);
  }

  /**
   * Get template versions (version history)
   */
  async getTemplateVersions(tenantId: string, templateId: string): Promise<IReportTemplateVersion[]> {
    const ReportTemplateVersion = await this.getReportTemplateVersionModel();

    // Verify template exists
    await this.getTemplateById(tenantId, templateId);

    const versions = await ReportTemplateVersion.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: new mongoose.Types.ObjectId(templateId),
    })
      .sort({ version: -1 }) // Latest first
      .populate('changedBy', 'email firstName lastName')
      .lean();

    return versions as IReportTemplateVersion[];
  }

  /**
   * Get specific template version
   */
  async getTemplateVersion(
    tenantId: string,
    templateId: string,
    version: number
  ): Promise<IReportTemplateVersion> {
    const ReportTemplateVersion = await this.getReportTemplateVersionModel();

    // Verify template exists
    await this.getTemplateById(tenantId, templateId);

    const versionEntry = await ReportTemplateVersion.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: new mongoose.Types.ObjectId(templateId),
      version,
    }).populate('changedBy', 'email firstName lastName');

    if (!versionEntry) {
      throw new NotFoundError(`Version ${version} not found for this template`);
    }

    return versionEntry;
  }

  /**
   * Rollback template to a specific version
   */
  async rollbackTemplate(
    tenantId: string,
    templateId: string,
    targetVersion: number,
    rolledBackBy: string
  ): Promise<IReportTemplate> {
    const ReportTemplate = await this.getReportTemplateModel();

    // Get the target version
    const targetVersionData = await this.getTemplateVersion(tenantId, templateId, targetVersion);

    // Get current template
    const template = await this.getTemplateById(tenantId, templateId);

    // Update template with version data
    template.name = targetVersionData.name;
    template.description = targetVersionData.description;
    template.category = targetVersionData.category;
    template.module = targetVersionData.module;
    template.query = targetVersionData.query;
    template.columns = targetVersionData.columns;
    template.filters = targetVersionData.filters;
    template.grouping = targetVersionData.grouping;
    template.sorting = targetVersionData.sorting;
    template.format = targetVersionData.format;

    // Increment version
    const newVersion = template.version + 1;
    template.version = newVersion;
    template.updatedBy = new mongoose.Types.ObjectId(rolledBackBy);
    template.updatedAt = new Date();

    await template.save();

    // Create version history entry for rollback
    await this.createVersionHistory(
      tenantId,
      templateId,
      template,
      rolledBackBy,
      `Rolled back to version ${targetVersion}`
    );

    logger.info(`Template ${templateId} rolled back to version ${targetVersion} by user ${rolledBackBy}`);

    return template;
  }

  /**
   * Compare two template versions
   */
  async compareVersions(
    tenantId: string,
    templateId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: IReportTemplateVersion;
    version2: IReportTemplateVersion;
    differences: any;
  }> {
    const v1 = await this.getTemplateVersion(tenantId, templateId, version1);
    const v2 = await this.getTemplateVersion(tenantId, templateId, version2);

    // Simple difference detection (can be enhanced)
    const differences: any = {
      name: v1.name !== v2.name,
      description: v1.description !== v2.description,
      category: v1.category !== v2.category,
      columns: JSON.stringify(v1.columns) !== JSON.stringify(v2.columns),
      filters: JSON.stringify(v1.filters) !== JSON.stringify(v2.filters),
      query: JSON.stringify(v1.query) !== JSON.stringify(v2.query),
    };

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  }

  /**
   * Clone template
   */
  async cloneTemplate(
    tenantId: string,
    templateId: string,
    newName: string,
    createdBy: string
  ): Promise<IReportTemplate> {
    const template = await this.getTemplateById(tenantId, templateId);

    return this.createTemplate(
      tenantId,
      {
        name: newName,
        description: `Cloned from: ${template.name}`,
        category: template.category,
        module: template.module,
        query: template.query,
        columns: template.columns,
        filters: template.filters,
        grouping: template.grouping,
        sorting: template.sorting,
        format: template.format,
        isSystemTemplate: false,
      },
      createdBy
    );
  }
}

export const reportTemplateService = new ReportTemplateService();

