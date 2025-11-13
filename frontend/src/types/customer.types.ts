/**
 * Customer Types
 * Type definitions for Customer Management
 */

export type CustomerType = 'regular' | 'wholesale' | 'distributor' | 'vip';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  type: CustomerType;
  loyaltyTier?: LoyaltyTier;
  loyaltyPoints: number;
  totalSpent: number;
  totalPurchases: number;
  creditLimit?: number;
  creditBalance: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
  isActive: boolean;
  lastPurchase?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  type?: CustomerType;
  loyaltyTier?: LoyaltyTier;
  creditLimit?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  type?: CustomerType;
  loyaltyTier?: LoyaltyTier;
  isActive?: boolean;
  minSpent?: number;
  maxSpent?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Array<{
    customer: Customer;
    totalSpent: number;
    totalOrders: number;
  }>;
}

export interface CustomerPurchaseHistory {
  _id: string;
  saleNumber: string;
  date: string;
  items: number;
  subtotal: number;
  total: number;
  status: string;
}

