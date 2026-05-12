import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días - debe ser >= maxAge
      staleTime: Infinity,
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_CACHE',
  throttleTime: 1000,
});