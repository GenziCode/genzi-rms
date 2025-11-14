import mongoose from 'mongoose';
import { getTenantConnection } from '../config/database';
import { ReportTemplateSchema, IReportTemplate } from '../models/reportTemplate.model';
import { ReportExecutionSchema, IReportExecution } from '../models/reportExecution.model';
import { getMasterConnection } from '../config/database';
import { reportTemplateService } from './reportTemplate.service';
import { NotFoundError, BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';
import moment from 'moment-timezone';

/**
 * Report Generation Service
 * Core service for generating reports from templates
 */
export class ReportGenerationService {
  /**
   * Get models
   */
  private async getModels(tenantId: string) {
    const masterConn = await getMasterConnection();
    const tenantConn = await getTenantConnection(tenantId);

    return {
      ReportTemplate:
        masterConn.models.ReportTemplate ||
        masterConn.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema),
      ReportExecution:
        masterConn.models.ReportExecution ||
        masterConn.model<IReportExecution>('ReportExecution', ReportExecutionSchema),
      tenantConnection: tenantConn,
    };
  }

  /**
   * Generate report from template
   */
  async generateReport(
    tenantId: string,
    templateId: string,
    parameters: Record<string, any> = {},
    executedBy: string
  ): Promise<{
    data: any[];
    metadata: {
      templateName: string;
      recordCount: number;
      executionTime: number;
      columns: any[];
    };
  }> {
    const startTime = Date.now();
    const { ReportTemplate, ReportExecution, tenantConnection } = await this.getModels(tenantId);

    // Get template
    const template = await reportTemplateService.getTemplateById(tenantId, templateId);

    if (!template.isActive) {
      throw new BadRequestError('Template is not active');
    }

    // Create execution record
    const execution = new ReportExecution({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      templateId: new mongoose.Types.ObjectId(templateId),
      reportName: template.name,
      reportType: 'template',
      parameters,
      status: 'running',
      startedAt: new Date(),
      executedBy: new mongoose.Types.ObjectId(executedBy),
    });
    await execution.save();

    try {
      // Build query from template
      const collection = tenantConnection.collection(template.query.collection);
      
      // Build match stage
      const matchStage: any = {
        ...template.query.baseMatch,
      };

      // Apply filters from parameters
      for (const filter of template.filters) {
        const paramValue = parameters[filter.field];
        
        if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
          switch (filter.type) {
            case 'dateRange':
              if (paramValue.start && paramValue.end) {
                matchStage[filter.field] = {
                  $gte: new Date(paramValue.start),
                  $lte: new Date(paramValue.end),
                };
              }
              break;
            case 'multiselect':
              if (Array.isArray(paramValue) && paramValue.length > 0) {
                matchStage[filter.field] = { $in: paramValue };
              }
              break;
            case 'select':
            case 'text':
            case 'number':
            case 'boolean':
              matchStage[filter.field] = paramValue;
              break;
          }
        } else if (filter.required && !filter.defaultValue) {
          throw new BadRequestError(`Required filter '${filter.label}' is missing`);
        } else if (filter.defaultValue !== undefined) {
          matchStage[filter.field] = filter.defaultValue;
        }
      }

      // Build aggregation pipeline
      const pipeline: any[] = [];

      // Match stage
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Add custom pipeline stages from template
      if (template.query.pipeline && template.query.pipeline.length > 0) {
        pipeline.push(...template.query.pipeline);
      }

      // Grouping stage
      if (template.grouping?.enabled && template.grouping.fields.length > 0) {
        const groupId: Record<string, any> = {};
        
        // Add grouping fields to _id
        for (const groupField of template.grouping.fields) {
          groupId[groupField.field] = `$${groupField.field}`;
        }

        // Add aggregations for columns
        const aggregations: Record<string, any> = {};
        for (const column of template.columns) {
          if (column.aggregate) {
            switch (column.aggregate) {
              case 'sum':
                aggregations[column.field] = { $sum: `$${column.field}` };
                break;
              case 'avg':
                aggregations[column.field] = { $avg: `$${column.field}` };
                break;
              case 'count':
                aggregations[column.field] = { $sum: 1 };
                break;
              case 'min':
                aggregations[column.field] = { $min: `$${column.field}` };
                break;
              case 'max':
                aggregations[column.field] = { $max: `$${column.field}` };
                break;
              case 'first':
                aggregations[column.field] = { $first: `$${column.field}` };
                break;
              case 'last':
                aggregations[column.field] = { $last: `$${column.field}` };
                break;
            }
          } else {
            aggregations[column.field] = { $first: `$${column.field}` };
          }
        }

        pipeline.push({
          $group: {
            _id: groupId,
            ...aggregations,
          },
        });

        // Flatten _id fields back to root level
        const projectFields: Record<string, any> = {};
        
        // Add grouped fields from _id
        for (const groupField of template.grouping.fields) {
          projectFields[groupField.field] = `$_id.${groupField.field}`;
        }
        
        // Add aggregated columns
        for (const column of template.columns) {
          projectFields[column.field] = 1;
        }

        pipeline.push({
          $project: projectFields,
        });
      }

      // Sorting stage
      if (template.sorting) {
        const sortField = parameters.sortField || template.sorting.defaultField;
        const sortOrder = parameters.sortOrder || template.sorting.defaultOrder;

        if (sortField) {
          pipeline.push({
            $sort: {
              [sortField]: sortOrder === 'asc' ? 1 : -1,
            },
          });
        }
      }

      // Execute aggregation
      const results = await collection.aggregate(pipeline).toArray();

      // Format results based on column definitions
      const formattedResults = results.map((row) => {
        const formatted: any = {};
        for (const column of template.columns) {
          if (column.visible) {
            let value = this.getNestedValue(row, column.field);
            
            // Format value based on type
            value = this.formatValue(value, column.type, column.format);
            
            formatted[column.field] = value;
          }
        }
        return formatted;
      });

      const duration = Date.now() - startTime;

      // Update execution record
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = duration;
      execution.recordCount = formattedResults.length;
      await execution.save();

      logger.info(
        `Report generated: ${template.name} - ${formattedResults.length} records in ${duration}ms`
      );

      return {
        data: formattedResults,
        metadata: {
          templateName: template.name,
          recordCount: formattedResults.length,
          executionTime: duration,
          columns: template.columns.filter((c) => c.visible),
        },
      };
    } catch (error: any) {
      // Update execution record with error
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = Date.now() - startTime;
      execution.error = {
        message: error.message,
        stack: error.stack,
        code: error.code,
      };
      await execution.save();

      logger.error(`Report generation failed: ${template.name}`, error);
      throw error;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Format value based on type
   */
  private formatValue(value: any, type: string, format?: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case 'date':
        if (format) {
          return moment(value).format(format);
        }
        return moment(value).toISOString();
      case 'currency':
        return typeof value === 'number' ? value.toFixed(2) : value;
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : value;
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    tenantId: string,
    filters?: {
      templateId?: string;
      scheduleId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<IReportExecution[]> {
    const { ReportExecution } = await this.getModels(tenantId);

    const query: any = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
    };

    if (filters?.templateId) {
      query.templateId = new mongoose.Types.ObjectId(filters.templateId);
    }

    if (filters?.scheduleId) {
      query.scheduleId = new mongoose.Types.ObjectId(filters.scheduleId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.startedAt = {};
      if (filters.startDate) {
        query.startedAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startedAt.$lte = filters.endDate;
      }
    }

    const limit = filters?.limit || 50;

    const executions = await ReportExecution.find(query)
      .sort({ startedAt: -1 })
      .limit(limit)
      .populate('templateId', 'name')
      .populate('scheduleId', 'name')
      .populate('executedBy', 'email firstName lastName');

    return executions;
  }
}

export const reportGenerationService = new ReportGenerationService();

