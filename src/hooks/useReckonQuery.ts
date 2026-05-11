import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook que lee de localStorage y se sincroniza automáticamente
 * cuando otros tabs/formularios guardan datos.
 */
export function useReckonQuery(key, fetchFn) {
  const queryClient = useQueryClient();

  // Escuchar cambios de localStorage de otras tabs/instancias
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '_reckon_sync' || e.key === 'reckon_data') {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, queryClient]);

  return useQuery({
    queryKey: [key],
    queryFn: fetchFn,
    staleTime: 0,           // Siempre considerar stale (fuerza re-lectura)
    gcTime: Infinity,     // Mantener en caché de React Query
    refetchOnWindowFocus: true,  // Recargar cuando vuelve el foco
    refetchOnMount: 'always',  // Siempre recargar al montar
  });
}