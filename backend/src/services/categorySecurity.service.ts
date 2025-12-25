import { getTenantConnection } from '../config/database';
import { CategorySecuritySchema, ICategorySecurity } from '../models/categorySecurity.model';
import { Model } from 'mongoose';
import { logger } from '../utils/logger';

export class CategorySecurityService {
  public async getCategorySecurityModel(tenantId: string): Promise<Model<ICategorySecurity>> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategorySecurity>('CategorySecurity', CategorySecuritySchema);
  }

  /**
   * Create or update security settings for a category
   */
  async setCategorySecurity(
    tenantId: string,
    categoryId: string,
    userId: string,
    securitySettings: Partial<ICategorySecurity>
  ): Promise<ICategorySecurity> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      // Check if security settings already exist for this category
      let security = await CategorySecurityModel.findOne({
        category: categoryId,
        tenantId
      });

      if (security) {
        // Update existing security settings
        Object.assign(security, securitySettings);
        await security.save();
      } else {
        // Create new security settings
        security = new CategorySecurityModel({
          tenantId,
          category: categoryId,
          ...securitySettings
        });
        await security.save();
      }

      logger.info(`Category security settings updated for category ${categoryId} by user ${userId}`);
      return security;
    } catch (error) {
      logger.error(`Error setting category security: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get security settings for a category
   */
  async getCategorySecurity(
    tenantId: string,
    categoryId: string
  ): Promise<ICategorySecurity | null> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      return await CategorySecurityModel.findOne({
        category: categoryId,
        tenantId
      });
    } catch (error) {
      logger.error(`Error getting category security: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Remove security settings for a category
   */
  async removeCategorySecurity(
    tenantId: string,
    categoryId: string
  ): Promise<void> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      await CategorySecurityModel.deleteOne({
        category: categoryId,
        tenantId
      });

      logger.info(`Category security settings removed for category ${categoryId} in tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Error removing category security: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get categories accessible by a user based on security settings
   */
  async getUserAccessibleCategories(
    tenantId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    categories: string[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      // Find all security records for the tenant
      const securityRecords = await CategorySecurityModel.find({ tenantId });

      const accessibleCategories: string[] = [];

      for (const security of securityRecords) {
        // Check if user has access to this category
        const hasAccess = await this.checkCategoryAccess(
          tenantId,
          security.category.toString(),
          userId
        );

        if (hasAccess.allowed) {
          accessibleCategories.push(security.category.toString());
        }
      }

      // Calculate pagination
      const total = accessibleCategories.length;
      const page = options.page || 1;
      const limit = options.limit || 10;
      const totalPages = Math.ceil(total / limit);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCategories = accessibleCategories.slice(startIndex, endIndex);

      return {
        categories: paginatedCategories,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error(`Error getting user accessible categories: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if a user has access to a category based on security settings
   */
  async checkCategoryAccess(
    tenantId: string,
    categoryId: string,
    userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      const security = await CategorySecurityModel.findOne({
        category: categoryId,
        tenantId
      });

      // If no security settings exist, allow access (default behavior)
      if (!security) {
        return { allowed: true };
      }

      // Check if user is specifically blocked
      if (security.blockedUsers && security.blockedUsers.some(id => id.toString() === userId)) {
        return {
          allowed: false,
          reason: 'User is specifically blocked from accessing this category'
        };
      }

      // Check if user role is blocked
      // This would require fetching the user's role, which we'll assume is done elsewhere
      // For now, we'll skip role-based blocking in favor of more specific controls

      // Check if user is specifically allowed (takes precedence over role-based access)
      if (security.allowedUsers && security.allowedUsers.some(id => id.toString() === userId)) {
        return { allowed: true };
      }

      // If only specific users are allowed, and this user isn't in the list, deny access
      if (security.allowedUsers && security.allowedUsers.length > 0) {
        return {
          allowed: false,
          reason: 'User is not in the allowed list for this category'
        };
      }

      // If we get here, access is allowed by default unless specifically blocked
      return { allowed: true };
    } catch (error) {
      logger.error(`Error checking category access: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Enable threat detection for a category
   */
  async enableThreatDetection(
    tenantId: string,
    categoryId: string,
    userId: string
  ): Promise<ICategorySecurity> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      // Find existing security settings or create new ones
      let security = await CategorySecurityModel.findOne({
        category: categoryId,
        tenantId
      });

      if (!security) {
        // Create new security settings with threat detection enabled
        security = new CategorySecurityModel({
          tenantId,
          category: categoryId,
          threatDetectionEnabled: true,
          securityLevel: 'high',
          securityPolicies: ['threat-detection']
        });
      } else {
        // Update existing security settings
        security.threatDetectionEnabled = true;

        // Add threat detection to policies if not already present
        if (!security.securityPolicies.includes('threat-detection')) {
          security.securityPolicies.push('threat-detection');
        }

        // Increase security level if it's low
        if (security.securityLevel === 'low') {
          security.securityLevel = 'medium';
        }
      }

      await security.save();

      logger.info(`Threat detection enabled for category ${categoryId} by user ${userId}`);
      return security;
    } catch (error) {
      logger.error(`Error enabling threat detection: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Apply a security policy to a category
   */
  async applySecurityPolicy(
    tenantId: string,
    categoryId: string,
    userId: string,
    policyName: string,
    policySettings?: Partial<ICategorySecurity>
  ): Promise<ICategorySecurity> {
    try {
      const CategorySecurityModel = await this.getCategorySecurityModel(tenantId);

      // Find existing security settings or create new ones
      let security = await CategorySecurityModel.findOne({
        category: categoryId,
        tenantId
      });

      if (!security) {
        // Create new security settings with the applied policy
        security = new CategorySecurityModel({
          tenantId,
          category: categoryId,
          securityPolicies: [policyName],
          ...policySettings
        });
      } else {
        // Update existing security settings
        if (!security.securityPolicies.includes(policyName)) {
          security.securityPolicies.push(policyName);
        }

        // Apply any additional policy settings
        if (policySettings) {
          Object.assign(security, policySettings);
        }
      }

      await security.save();

      logger.info(`Security policy "${policyName}" applied to category ${categoryId} by user ${userId}`);
      return security;
    } catch (error) {
      logger.error(`Error applying security policy: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if a user has admin access for security management
   */
  async checkAdminAccess(
    _tenantId: string,
    _userId: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would check if the user has admin or security management permissions
      // For now, we'll implement a basic check that could involve roles or specific permissions

      // This would typically involve checking against a user management system
      // to determine if the user has elevated privileges
      // For this implementation, we'll return true for demonstration purposes
      // In a real system, this would check roles/permissions in the database

      // Placeholder implementation - in a real system this would check user roles/permissions
      return true; // Assuming the user has admin rights for this example
    } catch (error) {
      logger.error(`Error checking admin access: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get user security permissions
   */
  async getUserSecurityPermissions(
    _tenantId: string,
    _userId: string
  ): Promise<{
    isAdmin: boolean;
    canManageSecurity: boolean;
    canViewSecurity: boolean;
  }> {
    try {
      // In a real implementation, this would fetch the user's specific permissions
      // from a permissions management system

      // Placeholder implementation
      return {
        isAdmin: true, // Placeholder - would check actual user role
        canManageSecurity: true, // Would check specific security management permission
        canViewSecurity: true // Would check specific security viewing permission
      };
    } catch (error) {
      logger.error(`Error getting user security permissions: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if an IP address is in the whitelist
   */
  private checkIpAgainstWhitelist(ipAddress: string, whitelist: string[]): boolean {
    // Handle IPv4 and IPv6 addresses
    for (const entry of whitelist) {
      // Check for exact match
      if (ipAddress === entry) {
        return true;
      }

      // Check for CIDR notation
      if (entry.includes('/')) {
        if (this.isIpInCidrRange(ipAddress, entry)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if an IP is in a CIDR range
   * Simplified implementation - in production, use a library like 'ip-cidr' or 'cidr-tools'
   */
  private isIpInCidrRange(ip: string, cidr: string): boolean {
    try {
      // This is a simplified implementation for demonstration
      // In production, use a proper IP manipulation library
      const [range, prefix] = cidr.split('/');
      const prefixNum = parseInt(prefix, 10);

      // For simplicity, only checking basic IPv4 ranges
      if (ip.includes(':') || range.includes(':')) {
        // For IPv6, we'd need a more sophisticated algorithm
        // For now, just do basic string matching
        return ip.startsWith(range.replace('::', ':'));
      }

      // Convert IPs to number arrays for comparison
      const ipParts = ip.split('.').map(Number);
      const rangeParts = range.split('.').map(Number);

      // Check if the IP is in the range based on the prefix
      const mask = ~((1 << (32 - prefixNum)) - 1);
      const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
      const rangeNum = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
      const maskedIp = ipNum & mask;
      const maskedRange = rangeNum & mask;

      return maskedIp === maskedRange;
    } catch (error) {
      logger.warn(`Could not validate IP against CIDR: ${ip} vs ${cidr}`, error);
      return false;
    }
  }
}