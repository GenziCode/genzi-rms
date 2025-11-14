import { TenantRequest } from '../types';
import { fieldPermissionService } from '../services/fieldPermission.service';

/**
 * Field Filter Utility
 * Helper functions for filtering response fields based on permissions
 */

/**
 * Filter single object response
 */
export async function filterResponseFields<T extends Record<string, any>>(
  req: TenantRequest,
  formName: string,
  data: T
): Promise<T> {
  if (!req.user || !req.tenant || !data) {
    return data;
  }

  try {
    return (await fieldPermissionService.filterFields(
      req.user.tenantId,
      req.user.id,
      formName,
      data
    )) as T;
  } catch (error) {
    // Return original data on error
    return data;
  }
}

/**
 * Filter array response
 */
export async function filterArrayResponseFields<T extends Record<string, any>>(
  req: TenantRequest,
  formName: string,
  data: T[]
): Promise<T[]> {
  if (!req.user || !req.tenant || !Array.isArray(data)) {
    return data;
  }

  try {
    return (await Promise.all(
      data.map(item =>
        fieldPermissionService.filterFields(
          req.user!.tenantId,
          req.user!.id,
          formName,
          item
        )
      )
    )) as T[];
  } catch (error) {
    return data;
  }
}

/**
 * Filter paginated response
 */
export async function filterPaginatedResponseFields<T extends Record<string, any>>(
  req: TenantRequest,
  formName: string,
  data: {
    items: T[];
    total: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  }
): Promise<typeof data> {
  if (!req.user || !req.tenant || !data.items) {
    return data;
  }

  try {
    const filteredItems = await Promise.all(
      data.items.map(item =>
        fieldPermissionService.filterFields(
          req.user!.tenantId,
          req.user!.id,
          formName,
          item
        )
      )
    );

    return {
      ...data,
      items: filteredItems as T[],
    };
  } catch (error) {
    return data;
  }
}

