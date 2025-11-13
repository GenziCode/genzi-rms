/**
 * User Types
 * Type definitions for User Management
 */

export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'kitchen_staff' | 'waiter';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
  phone?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: string;
  loginCount: number;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions?: string[];
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  status?: UserStatus;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  permissions?: string[];
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

