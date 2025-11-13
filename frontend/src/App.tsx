import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
            <Toaster position="top-right" />
          </BrowserRouter>
        </StoreProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

