import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'kitchen' | 'waiter';
  isActive: boolean;
  permissions?: string[];
  tenantId?: string;
}

interface TenantContext {
  id: string;
  name: string;
  subdomain: string;
}

interface AuthState {
  user: User | null;
  tenant: string | null; // subdomain (used for X-Tenant header)
  tenantId: string | null;
  tenantName: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (
    user: User,
    tenant: TenantContext,
    accessToken: string,
    refreshToken: string
  ) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      tenantId: null,
      tenantName: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, tenant, accessToken, refreshToken) => {
        set({
          user,
          tenant: tenant.subdomain,
          tenantId: tenant.id,
          tenantName: tenant.name,
          accessToken,
          refreshToken,
        });
      },

      logout: () =>
        set((state) => ({
          user: null,
          // Keep tenant - it's device/browser-specific, not session-specific
          tenant: state.tenant,
          tenantId: state.tenantId,
          tenantName: state.tenantName,
          accessToken: null,
          refreshToken: null,
        })),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
