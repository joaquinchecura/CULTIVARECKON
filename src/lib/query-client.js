import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/react-query-persist-client';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24, // 24 horas - CRÍTICO para persistencia
      staleTime: Infinity,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_CACHE',
});