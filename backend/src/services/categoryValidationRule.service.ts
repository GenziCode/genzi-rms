import { getTenantConnection } from '../config/database';
import { CategoryValidationRuleSchema, ICategoryValidationRule } from '../models/categoryValidationRule.model';
import { ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';

export class CategoryValidationRuleService {
  public async getCategoryValidationRuleModel(tenantId: string): Promise<any> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryValidationRule>('CategoryValidationRule', CategoryValidationRuleSchema);
  }

  /**
   * Create a new category validation rule
   */
  async createValidationRule(
    tenantId: string,
    data: Omit<ICategoryValidationRule, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>
  ): Promise<ICategoryValidationRule> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    // Check if rule name already exists for this tenant
    const existing = await CategoryValidationRule.findOne({
      name: data.name,
      tenantId,
    });

    if (existing) {
      throw new AppError('Validation rule with this name already exists', 409);
    }

    // Validate validation type and value compatibility
    this.validateRuleData(data);

    const rule = new CategoryValidationRule({
      ...data,
      tenantId,
    });

    await rule.save();
    return rule;
  }

  /**
   * Get validation rules with pagination and filtering
   */
  async getValidationRules(
    tenantId: string,
    {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      field,
      validationType,
      isActive = true,
    }: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      field?: string;
      validationType?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{
    rules: ICategoryValidationRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    // Build query
    const query: any = { tenantId, isActive };
    if (field) query.field = field;
    if (validationType) query.validationType = validationType;

    // Count total
    const total = await CategoryValidationRule.countDocuments(query);

    // Get rules
    const rules = await CategoryValidationRule.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return {
      rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific validation rule by ID
   */
  async getValidationRuleById(
    tenantId: string,
    ruleId: string
  ): Promise<ICategoryValidationRule | null> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    const rule = await CategoryValidationRule.findOne({
      _id: ruleId,
      tenantId,
    });

    return rule;
  }

  /**
   * Update a validation rule
   */
  async updateValidationRule(
    tenantId: string,
    ruleId: string,
    data: Partial<Omit<ICategoryValidationRule, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>
  ): Promise<ICategoryValidationRule> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    const rule = await CategoryValidationRule.findOne({
      _id: ruleId,
      tenantId,
    });

    if (!rule) {
      throw new AppError('Validation rule not found', 404);
    }

    // If name is being updated, check for uniqueness
    if (data.name && data.name !== rule.name) {
      const existing = await CategoryValidationRule.findOne({
        name: data.name,
        tenantId,
      });

      if (existing) {
        throw new AppError('Validation rule with this name already exists', 409);
      }
    }

    // Validate validation type and value compatibility if they are being updated
    if (data.validationType || data.validationValue) {
      const updatedData = { ...rule.toObject(), ...data };
      this.validateRuleData(updatedData as ICategoryValidationRule);
    }

    Object.assign(rule, data);
    await rule.save();

    return rule;
  }

  /**
   * Delete a validation rule
   */
  async deleteValidationRule(
    tenantId: string,
    ruleId: string
  ): Promise<void> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    const rule = await CategoryValidationRule.findOne({
      _id: ruleId,
      tenantId,
    });

    if (!rule) {
      throw new AppError('Validation rule not found', 404);
    }

    await CategoryValidationRule.deleteOne({ _id: ruleId });
  }

  /**
   * Validate a category against active validation rules
   */
  async validateCategory(
    tenantId: string,
    category: Partial<ICategory>,
    categoryId?: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    // Get all active validation rules for this tenant
    const rules = await CategoryValidationRule.find({
      tenantId,
      isActive: true,
    }).sort({ priority: 1 }); // Sort by priority to enforce order of validation

    const errors: string[] = [];

    for (const rule of rules) {
      const fieldValue = (category as any)[rule.field];

      // Skip validation if field is not being set (unless it's required)
      if (fieldValue === undefined || fieldValue === null) {
        if (rule.validationType === 'required') {
          errors.push(rule.errorMessage || `Field ${rule.field} is required`);
        }
        continue;
      }

      // Apply validation based on type
      switch (rule.validationType) {
        case 'required':
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            errors.push(rule.errorMessage);
          }
          break;

        case 'minLength':
          if (typeof fieldValue === 'string' && fieldValue.length < Number(rule.validationValue)) {
            errors.push(rule.errorMessage);
          }
          break;

        case 'maxLength':
          if (typeof fieldValue === 'string' && fieldValue.length > Number(rule.validationValue)) {
            errors.push(rule.errorMessage);
          }
          break;

        case 'pattern':
          if (typeof fieldValue === 'string') {
            const regex = new RegExp(rule.validationValue as string);
            if (!regex.test(fieldValue)) {
              errors.push(rule.errorMessage);
            }
          }
          break;

        case 'unique':
          if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
            // Check if another category has this value (excluding current category if updating)
            const query: any = { [rule.field]: fieldValue, tenantId };
            if (categoryId) {
              query._id = { $ne: categoryId };
            }

            const existing = await this.getCategoryModel(tenantId);
            const count = await existing.countDocuments(query);

            if (count > 0) {
              errors.push(rule.errorMessage);
            }
          }
          break;

        case 'custom':
          // For custom validation, we could execute custom logic here
          // For now, we'll skip this type as it requires more complex implementation
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation rules for a specific field
   */
  async getValidationRulesByField(
    tenantId: string,
    field: string
  ): Promise<ICategoryValidationRule[]> {
    const CategoryValidationRule = await this.getCategoryValidationRuleModel(tenantId);

    return await CategoryValidationRule.find({
      tenantId,
      field,
      isActive: true,
    }).sort({ priority: 1 });
  }

  /**
   * Validate rule data to ensure validation type and value compatibility
   */
  private validateRuleData(data: Partial<ICategoryValidationRule>) {
    switch (data.validationType) {
      case 'minLength':
      case 'maxLength':
        if (typeof data.validationValue !== 'number' || data.validationValue < 0) {
          throw new AppError(`Validation value for ${data.validationType} must be a non-negative number`, 400);
        }
        break;

      case 'pattern':
        if (typeof data.validationValue !== 'string') {
          throw new AppError('Validation value for pattern must be a string', 400);
        }
        try {
          new RegExp(data.validationValue as string);
        } catch (e) {
          throw new AppError('Validation value for pattern must be a valid regular expression', 400);
        }
        break;

      case 'required':
      case 'unique':
        // These don't require specific validationValue types
        break;

      case 'custom':
        // Custom validation would require additional validation
        break;

      default:
        throw new AppError(`Invalid validation type: ${data.validationType}`, 400);
    }
  }

 /**
   * Helper method to get category model for unique validation
   */
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    const { CategorySchema } = await import('../models/category.model');
    return connection.model<ICategory>('Category', CategorySchema);
  }
}