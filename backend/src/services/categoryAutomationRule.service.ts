import { getTenantConnection } from '../config/database';
import { CategoryAutomationRuleSchema, ICategoryAutomationRule } from '../models/categoryAutomationRule.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryAutomationRuleService {
  public async getCategoryAutomationRuleModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryAutomationRule>('CategoryAutomationRule', CategoryAutomationRuleSchema);
  }

  /**
   * Create a new automation rule
   */
  async createRule(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      triggerEvent: string;
      conditions: any[];
      actions: any[];
      priority?: number;
    }
  ): Promise<ICategoryAutomationRule> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      // Check if rule name already exists for this tenant
      const existing = await CategoryAutomationRule.findOne({
        name: data.name,
        tenantId,
        isActive: true,
      });

      if (existing) {
        throw new AppError('Automation rule with this name already exists', 409);
      }

      const rule = new CategoryAutomationRule({
        ...data,
        tenantId,
        priority: data.priority || 0,
        createdBy: userId,
        updatedBy: userId,
      });

      await rule.save();

      logger.info(`Automation rule created: ${rule.name} (${rule._id})`);
      return rule;
    } catch (error) {
      logger.error('Error creating automation rule:', error);
      throw error;
    }
  }

  /**
   * Get all automation rules for a tenant
   */
  async getRules(
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
    rules: ICategoryAutomationRule[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      const {
        includeInactive = false,
        search = '',
        sortBy = 'priority',
        sortOrder = 'asc',
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
      const total = await CategoryAutomationRule.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get rules
      const rules = await CategoryAutomationRule.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        rules,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting automation rules:', error);
      throw error;
    }
  }

  /**
   * Get automation rule by ID
   */
  async getRuleById(
    tenantId: string,
    ruleId: string
  ): Promise<ICategoryAutomationRule> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      const rule = await CategoryAutomationRule.findOne({
        _id: ruleId,
        tenantId,
      });

      if (!rule) {
        throw new AppError('Automation rule not found', 404);
      }

      return rule;
    } catch (error) {
      logger.error('Error getting automation rule:', error);
      throw error;
    }
  }

  /**
   * Update automation rule
   */
  async updateRule(
    tenantId: string,
    ruleId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      triggerEvent: string;
      conditions: any[];
      actions: any[];
      isActive: boolean;
      priority: number;
    }>
  ): Promise<ICategoryAutomationRule> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      const rule = await CategoryAutomationRule.findOne({
        _id: ruleId,
        tenantId,
      });

      if (!rule) {
        throw new AppError('Automation rule not found', 404);
      }

      // Check if new name conflicts with existing
      if (data.name && data.name !== rule.name) {
        const existing = await CategoryAutomationRule.findOne({
          name: data.name,
          tenantId,
          _id: { $ne: ruleId },
          isActive: true,
        });

        if (existing) {
          throw new AppError('Automation rule with this name already exists', 409);
        }
      }

      // Update fields
      Object.assign(rule, data, { updatedBy: userId });

      await rule.save();

      logger.info(`Automation rule updated: ${rule.name} (${rule._id})`);
      return rule;
    } catch (error) {
      logger.error('Error updating automation rule:', error);
      throw error;
    }
  }

  /**
   * Delete automation rule (soft delete)
   */
  async deleteRule(
    tenantId: string,
    ruleId: string,
    userId: string
  ): Promise<void> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      const rule = await CategoryAutomationRule.findOne({
        _id: ruleId,
        tenantId,
      });

      if (!rule) {
        throw new AppError('Automation rule not found', 404);
      }

      // Soft delete
      rule.isActive = false;
      rule.updatedBy = userId as any;
      await rule.save();

      logger.info(`Automation rule deleted: ${rule.name} (${rule._id})`);
    } catch (error) {
      logger.error('Error deleting automation rule:', error);
      throw error;
    }
  }

  /**
   * Trigger automation rules based on an event
   */
  async triggerRules(
    tenantId: string,
    event: string,
    categoryData: any
  ): Promise<void> {
    try {
      const CategoryAutomationRule = await this.getCategoryAutomationRuleModel(tenantId);

      // Find all active rules that are triggered by this event
      const rules = await CategoryAutomationRule.find({
        triggerEvent: event,
        isActive: true,
        tenantId,
      }).sort({ priority: 1 }); // Execute in priority order

      // Process each rule
      for (const rule of rules) {
        if (this.evaluateConditions(rule.conditions, categoryData)) {
          await this.executeActions(rule.actions, categoryData);
        }
      }
    } catch (error) {
      logger.error('Error triggering automation rules:', error);
      throw error;
    }
  }

  /**
   * Evaluate rule conditions
   */
  public evaluateConditions(conditions: any[], categoryData: any): boolean {
    // If no conditions, return true (rule will execute)
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
          logger.warn(`Unknown operator in automation rule condition: ${operator}`);
          break;
      }
    }

    return true;
  }

  /**
   * Execute rule actions
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
        case 'updateCategory':
          // Update category properties
          logger.info(`Updating category: ${categoryData.name}`, config);
          break;
        default:
          logger.warn(`Unknown action type in automation rule: ${type}`);
          break;
      }
    }
  }
}