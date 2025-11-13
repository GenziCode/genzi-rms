import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Store {
  _id: string;
  name: string;
  code: string;
  isDefault: boolean;
}

interface StoreContextType {
  currentStore: Store | null;
  stores: Store[];
  setCurrentStore: (store: Store) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  // For now, use a default store. This will be fetched from API in Phase 8 complete implementation
  const [currentStore, setCurrentStoreState] = useState<Store>({
    _id: '000000000000000000000001',
    name: 'Main Store',
    code: 'MAIN',
    isDefault: true,
  });

  const [stores] = useState<Store[]>([currentStore]);

  const setCurrentStore = (store: Store) => {
    setCurrentStoreState(store);
    localStorage.setItem('currentStoreId', store._id);
  };

  // Load saved store from localStorage
  useEffect(() => {
    const savedStoreId = localStorage.getItem('currentStoreId');
    if (savedStoreId && savedStoreId !== currentStore._id) {
      const found = stores.find(s => s._id === savedStoreId);
      if (found) {
        setCurrentStoreState(found);
      }
    }
  }, []);

  return (
    <StoreContext.Provider value={{ currentStore, stores, setCurrentStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

