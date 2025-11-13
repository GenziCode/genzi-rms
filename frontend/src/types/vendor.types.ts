/**
 * Vendor Types
 * Type definitions for Vendor Management
 */

export interface Vendor {
  _id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  currentBalance: number;
  totalPurchased: number;
  totalOrders: number;
  products?: string[]; // Array of product IDs that this vendor supplies
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  isActive?: boolean;
}

export interface VendorFilters {
  search?: string;
  isActive?: boolean;
  minPurchased?: number;
  maxPurchased?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface VendorListResponse {
  vendors: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  totalPurchases: number;
  averageOrderValue: number;
  topVendors: Array<{
    vendor: Vendor;
    totalPurchased: number;
    totalOrders: number;
  }>;
}

