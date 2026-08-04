import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';
import type { RestaurantSyncState } from '../types';

export function useRestaurantState(onSocketEvent?: (event: string, data: unknown) => void) {
  const { user } = useAuth();
  const restaurantId = user?.restaurantId;
  const queryClient = useQueryClient();

  const query = useQuery<{ state: RestaurantSyncState }, Error>({
    queryKey: ['restaurantSync', restaurantId],
    queryFn: () => api.getSyncState(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 10000,
  });

  const handleSocketEvent = useCallback(
    (event: string, data: unknown) => {
      if (!restaurantId) return;

      if (event === 'restaurant:sync') {
        const payload = data as { state: RestaurantSyncState };
        if (payload && payload.state) {
          queryClient.setQueryData(['restaurantSync', restaurantId], payload);
          return;
        }
      }

      const relevant = [
        'queue:updated',
        'queue:joined',
        'queue:notified',
        'queue:onMyWay',
        'table:statusChanged',
        'order:created',
        'order:cooking',
        'order:ready',
      ];

      if (relevant.includes(event)) {
        queryClient.invalidateQueries({ queryKey: ['restaurantSync', restaurantId] });
      }

      if (onSocketEvent) {
        onSocketEvent(event, data);
      }
    },
    [queryClient, restaurantId, onSocketEvent]
  );

  useSocket(restaurantId, handleSocketEvent);

  return {
    ...query,
    state: query.data?.state as RestaurantSyncState | undefined,
  };
}
