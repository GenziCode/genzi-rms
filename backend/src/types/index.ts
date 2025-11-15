import { Request } from 'express';
import { Connection } from 'mongoose';

// Extend Express Request with tenant context
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    tenantId: string;
    name: string;
    subdomain: string;
    dbName: string;
    connection: Connection;
    features: Record<string, boolean>;
    limits: Record<string, number>;
    subscription: {
      plan: string;
      status: string;
    };
  };
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// User Roles
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  KITCHEN_STAFF = 'kitchen_staff',
  WAITER = 'waiter',
  INVENTORY_CLERK = 'inventory_clerk',
}

// Tenant Status
export enum TenantStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// Subscription Plans
export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// Subscription Status
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Database connection cache
export interface ConnectionCache {
  [tenantId: string]: Connection;
}

