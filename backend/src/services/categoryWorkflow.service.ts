import { getTenantConnection } from '../config/database';
import { CategoryWorkflowSchema, ICategoryWorkflow } from '../models/categoryWorkflow.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryWorkflowService {
  public async getCategoryWorkflowModel(tenantId: string): Promise<any> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryWorkflow>('CategoryWorkflow', CategoryWorkflowSchema);
  }

  /**
   * Create a new category workflow
   */
  async createWorkflow(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      triggerEvents: string[];
      conditions: any[];
      actions: any[];
    }
  ): Promise<ICategoryWorkflow> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      // Check if workflow name already exists for this tenant
      const existing = await CategoryWorkflow.findOne({
        name: data.name,
        tenantId,
        isActive: true,
      });

      if (existing) {
        throw new AppError('Workflow with this name already exists', 409);
      }

      const workflow = new CategoryWorkflow({
        ...data,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });

      await workflow.save();

      logger.info(`Category workflow created: ${workflow.name} (${workflow._id})`);
      return workflow;
    } catch (error) {
      logger.error('Error creating category workflow:', error);
      throw error;
    }
  }

  /**
   * Get all category workflows for a tenant
   */
  async getWorkflows(
    tenantId: string,
    options: {
      includeInactive?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    workflows: ICategoryWorkflow[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      const {
        includeInactive = false,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 50,
      } = options;

      // Build query
      const query: any = { tenantId };
      if (!includeInactive) {
        query.isActive = true;
      }
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Count total
      const total = await CategoryWorkflow.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get workflows
      const workflows = await CategoryWorkflow.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        workflows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting category workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(
    tenantId: string,
    workflowId: string
  ): Promise<ICategoryWorkflow> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      const workflow = await CategoryWorkflow.findOne({
        _id: workflowId,
        tenantId,
      });

      if (!workflow) {
        throw new AppError('Workflow not found', 404);
      }

      return workflow;
    } catch (error) {
      logger.error('Error getting category workflow:', error);
      throw error;
    }
  }

  /**
   * Update category workflow
   */
  async updateWorkflow(
    tenantId: string,
    workflowId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      triggerEvents: string[];
      conditions: any[];
      actions: any[];
      isActive: boolean;
    }>
  ): Promise<ICategoryWorkflow> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      const workflow = await CategoryWorkflow.findOne({
        _id: workflowId,
        tenantId,
      });

      if (!workflow) {
        throw new AppError('Workflow not found', 404);
      }

      // Check if new name conflicts with existing
      if (data.name && data.name !== workflow.name) {
        const existing = await CategoryWorkflow.findOne({
          name: data.name,
          tenantId,
          _id: { $ne: workflowId },
          isActive: true,
        });

        if (existing) {
          throw new AppError('Workflow with this name already exists', 409);
        }
      }

      // Update fields
      Object.assign(workflow, data, { updatedBy: userId });

      await workflow.save();

      logger.info(`Category workflow updated: ${workflow.name} (${workflow._id})`);
      return workflow;
    } catch (error) {
      logger.error('Error updating category workflow:', error);
      throw error;
    }
  }

  /**
   * Delete category workflow (soft delete)
   */
  async deleteWorkflow(
    tenantId: string,
    workflowId: string,
    userId: string
  ): Promise<void> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      const workflow = await CategoryWorkflow.findOne({
        _id: workflowId,
        tenantId,
      });

      if (!workflow) {
        throw new AppError('Workflow not found', 404);
      }

      // Soft delete
      workflow.isActive = false;
      workflow.updatedBy = userId as any;
      await workflow.save();

      logger.info(`Category workflow deleted: ${workflow.name} (${workflow._id})`);
    } catch (error) {
      logger.error('Error deleting category workflow:', error);
      throw error;
    }
  }

  /**
   * Trigger workflows based on an event
   */
  async triggerWorkflows(
    tenantId: string,
    event: string,
    categoryData: any
  ): Promise<void> {
    try {
      const CategoryWorkflow = await this.getCategoryWorkflowModel(tenantId);

      // Find all active workflows that are triggered by this event
      const workflows = await CategoryWorkflow.find({
        triggerEvents: event,
        isActive: true,
        tenantId,
      });

      // Process each workflow
      for (const workflow of workflows) {
        if (this.evaluateConditions(workflow.conditions, categoryData)) {
          await this.executeActions(workflow.actions, categoryData);
        }
      }
    } catch (error) {
      logger.error('Error triggering workflows:', error);
      throw error;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  public evaluateConditions(conditions: any[], categoryData: any): boolean {
    // If no conditions, return true (workflow will execute)
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // For now, we'll implement a simple AND logic for all conditions
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const fieldValue = categoryData[field];

      switch (operator) {
        case 'equals':
          if (fieldValue !== value) return false;
          break;
        case 'notEquals':
          if (fieldValue === value) return false;
          break;
        case 'contains':
          if (typeof fieldValue !== 'string' || !fieldValue.includes(value)) return false;
          break;
        case 'greaterThan':
          if (typeof fieldValue !== 'number' || fieldValue <= value) return false;
          break;
        case 'lessThan':
          if (typeof fieldValue !== 'number' || fieldValue >= value) return false;
          break;
        case 'in':
          if (!Array.isArray(value) || !value.includes(fieldValue)) return false;
          break;
        default:
          logger.warn(`Unknown operator in workflow condition: ${operator}`);
          break;
      }
    }

    return true;
  }

  /**
   * Execute workflow actions
   */
  private async executeActions(actions: any[], categoryData: any): Promise<void> {
    for (const action of actions) {
      const { type, config } = action;

      switch (type) {
        case 'sendNotification':
          // Send notification based on config
          logger.info(`Sending notification for category: ${categoryData.name}`, config);
          break;
        case 'updateField':
          // Update a field in the category or related entity
          logger.info(`Updating field for category: ${categoryData.name}`, config);
          break;
        case 'createTask':
          // Create a task for a user or team
          logger.info(`Creating task for category: ${categoryData.name}`, config);
          break;
        case 'triggerAPI':
          // Call an external API
          logger.info(`Triggering API for category: ${categoryData.name}`, config);
          break;
        default:
          logger.warn(`Unknown action type in workflow: ${type}`);
          break;
      }
    }
  }
}