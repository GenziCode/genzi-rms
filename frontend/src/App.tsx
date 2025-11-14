import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './routes';
import { StoreProvider } from './contexts/StoreContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <BrowserRouter>
            <AppRoutes />
            <SonnerToaster position="top-right" richColors />
          </BrowserRouter>
        </StoreProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

