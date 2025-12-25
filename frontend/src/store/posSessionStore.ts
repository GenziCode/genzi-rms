import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface POSSessionData {
  sessionId: string;
  sessionStart: string;
  salesCount: number;
  totalRevenue: number;
  totalItemsSold: number;
  lastSaleTime: string | null;
  averageOrderValue: number;
  lastUpdated: string;
}

interface POSSessionState {
  session: POSSessionData;
  recordSale: (revenue: number, itemCount: number) => void;
  resetSession: () => void;
  getSessionStats: () => POSSessionData;
}

const createNewSession = (): POSSessionData => ({
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  sessionStart: new Date().toISOString(),
  salesCount: 0,
  totalRevenue: 0,
  totalItemsSold: 0,
  lastSaleTime: null,
  averageOrderValue: 0,
  lastUpdated: new Date().toISOString(),
});

export const usePOSSessionStore = create<POSSessionState>()(
  persist(
    (set, get) => ({
      session: createNewSession(),

      recordSale: (revenue: number, itemCount: number) => {
        set((state) => {
          const newSalesCount = state.session.salesCount + 1;
          const newTotalRevenue = state.session.totalRevenue + revenue;
          const newTotalItemsSold = state.session.totalItemsSold + itemCount;
          const newAverageOrderValue = newTotalRevenue / newSalesCount;

          return {
            session: {
              ...state.session,
              salesCount: newSalesCount,
              totalRevenue: newTotalRevenue,
              totalItemsSold: newTotalItemsSold,
              lastSaleTime: new Date().toISOString(),
              averageOrderValue: Number.isFinite(newAverageOrderValue) ? newAverageOrderValue : 0,
              lastUpdated: new Date().toISOString(),
            },
          };
        });
      },

      resetSession: () => {
        set({ session: createNewSession() });
      },

      getSessionStats: () => get().session,
    }),
    {
      name: 'pos-session-store',
      // Reset session daily or on significant time gap
      migrate: (persistedState: any, version) => {
        const state = persistedState as { state: { session: POSSessionData } };
        if (state?.state?.session) {
          const session = state.state.session;
          const sessionStart = new Date(session.sessionStart);
          const now = new Date();
          const hoursDiff = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

          // Reset session if it's been more than 8 hours
          if (hoursDiff > 8) {
            return { session: createNewSession() };
          }
        }
        return persistedState;
      },
    }
  )
);
