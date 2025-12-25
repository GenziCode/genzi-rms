// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// User Types
export type UserRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'kitchen'
  | 'waiter';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string; // Backend returns this!
  isActive: boolean;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tenant Types
export interface Tenant {
  _id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'trial';
  subscription?: {
    plan: string;
    expiresAt?: string;
  };
  createdAt: string;
}

// Login/Register Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tenant: {
    id: string;
    subdomain: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn?: string | number;
}

export interface RegisterResponse {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    url: string;
  };
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterTenantRequest {
  name: string;
  subdomain: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  totalSales: number;
  salesGrowth: number;
  ordersCount: number;
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
}
